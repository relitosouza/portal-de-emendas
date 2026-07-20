import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { readJsonFile, writeJsonFile, FINANCIAL_FILE, FinancialRecord } from "@/lib/json-storage";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";
import { requireTrustedOrigin } from "@/lib/request-security";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FIELD_LENGTH = 1000000; // 1MB per field
const MAX_COLUMNS = 100;
const MAX_ROWS = 100000;

function parseCSV(content: string): string[][] {
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
    }

    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];
    let rowCount = 0;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i + 1];

        // Check field length limit
        if (current.length > MAX_FIELD_LENGTH) {
            throw new Error(`Field exceeds maximum length of ${MAX_FIELD_LENGTH} bytes at row ${rowCount + 1}`);
        }

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === "," || char === ";") {
                row.push(current.trim());
                current = "";

                // Check column count limit
                if (row.length > MAX_COLUMNS) {
                    throw new Error(`Row ${rowCount + 1} exceeds maximum column count of ${MAX_COLUMNS}`);
                }
            } else if (char === "\n" || (char === "\r" && next === "\n")) {
                row.push(current.trim());
                current = "";
                if (row.some((cell) => cell !== "")) {
                    rows.push(row);
                    rowCount++;

                    // Check row count limit
                    if (rowCount > MAX_ROWS) {
                        throw new Error(`CSV exceeds maximum row count of ${MAX_ROWS}`);
                    }
                }
                row = [];
                if (char === "\r") i++;
            } else {
                current += char;
            }
        }
    }

    if (current || row.length > 0) {
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
            rows.push(row);
        }
    }

    return rows;
}

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    // Rate limiting: max 10 imports per hour per IP
    const clientIp = getClientIp(request);
    const IMPORT_LIMIT = 10;
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour

    const rateLimit = await checkRateLimit(`financial-import:${clientIp}`, IMPORT_LIMIT, WINDOW_MS);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.retryAfterMs);

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Arquivo CSV obrigatório" }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `Arquivo excede tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 413 }
            );
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV vazio ou sem dados" }, { status: 400 });
        }

        const dataRows = rows.slice(1);
        const now = new Date().toISOString();

        const csvRecords: FinancialRecord[] = dataRows.map((row) => ({
            amendmentId: row[0] || "",
            empenhado: row[1] || "0",
            liquidado: row[2] || "0",
            pago: row[3] || "0",
            reservado: row[4] || "0",
            updatedAt: row[5] || now,
        }));

        // Merge with existing — usa json-storage (Redis em prod, disco em dev)
        const existing = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

        const existingMap = new Map<string, FinancialRecord>();
        for (const rec of existing) {
            existingMap.set(rec.amendmentId, rec);
        }

        let updated = 0;
        let added = 0;

        for (const rec of csvRecords) {
            if (existingMap.has(rec.amendmentId)) {
                updated++;
            } else {
                added++;
            }
            existingMap.set(rec.amendmentId, rec);
        }

        const merged = Array.from(existingMap.values());
        await writeJsonFile(FINANCIAL_FILE, merged);

        return NextResponse.json({
            success: true,
            updated,
            added,
            total: merged.length,
        });
    } catch (error) {
        console.error("Error importing financial CSV:", error);
        const message = error instanceof Error ? error.message : "Falha ao importar CSV financeiro";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
