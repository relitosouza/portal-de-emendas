import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { addFinancialEvent, FinancialEventType } from "@/lib/json-storage";

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

    // Simple parser that handles quotes and both , and ; as delimiters
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

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const tipo = formData.get("tipo") as FinancialEventType | null;
        const amendmentIdFromParams = formData.get("amendmentId") as string | null;

        if (!file || !tipo) {
            return NextResponse.json({ error: "Arquivo CSV e 'tipo' são obrigatórios" }, { status: 400 });
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

        const headers = rows[0].map(h => h.toLowerCase());
        const dataRows = rows.slice(1);

        let added = 0;
        let errors = 0;

        for (const row of dataRows) {
            try {
                // Map row to event object based on columns
                // Expected columns for Empenho: numero, data, valor, credor, processo, descricao, subEmpenho
                // Expected columns for Liquidacao: numero, data, valor, descricao
                // Expected columns for Pagamento: data, valor, banco, agencia, documento, ordemBancaria, descricao
                
                // If the CSV has an 'amendmentId' column, use it. Otherwise use the one from params.
                let targetAmendmentId = amendmentIdFromParams;
                const ammendIdx = headers.indexOf("amendmentid");
                if (ammendIdx !== -1 && row[ammendIdx]) {
                    targetAmendmentId = row[ammendIdx];
                }

                if (!targetAmendmentId) {
                    errors++;
                    continue;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const event: any = {};
                headers.forEach((header, idx) => {
                    if (header !== "amendmentid") {
                        event[header] = row[idx] || "";
                    }
                });

                await addFinancialEvent(targetAmendmentId, tipo, event);
                added++;
            } catch (err) {
                console.error("Error adding row from CSV:", err);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            added,
            errors,
            totalRows: dataRows.length
        });
    } catch (error) {
        console.error("Error importing events CSV:", error);
        return NextResponse.json({ error: "Falha ao importar CSV de eventos" }, { status: 500 });
    }
}
