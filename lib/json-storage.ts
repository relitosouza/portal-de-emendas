import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";
import { Amendment } from "@/lib/store";

// =====================================================
// Storage Strategy
// =====================================================

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

let _redis: Redis | null = null;
function getRedis(): Redis {
    if (!_redis) _redis = Redis.fromEnv();
    return _redis;
}

function bundledPath(filename: string) {
    return path.join(BUNDLED_DATA_DIR, filename);
}

function filenameToKey(filename: string): string {
    return filename.endsWith(".json") ? filename.slice(0, -5) : filename;
}

export const AMENDMENTS_FILE = "amendments.json";
export const EXTERNAL_FILE = "emendas-externas.json";
export const FINANCIAL_FILE = "financial.json";
export const CARDS_FILE = "cards.json";

// =====================================================
// Helpers
// =====================================================

export async function readJsonFile<T>(filename: string): Promise<T[]> {
    if (IS_VERCEL) {
        try {
            const data = await getRedis().get<T[]>(filenameToKey(filename));
            if (data) return data;
            // KV vazio — fallback para bundle do deploy (primeira vez após deploy)
        } catch (err) {
            console.error(`[json-storage] Redis read failed for "${filename}":`, err);
            // Fallback para bundle em caso de falha do Redis
        }
    }
    try {
        const content = await fs.readFile(bundledPath(filename), "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    if (IS_VERCEL) {
        try {
            await getRedis().set(filenameToKey(filename), data);
            return;
        } catch (err) {
            console.error(`[json-storage] Redis write failed for "${filename}":`, err);
            throw err;
        }
    }
    // Dev local: escreve no disco
    await fs.mkdir(BUNDLED_DATA_DIR, { recursive: true });
    await fs.writeFile(bundledPath(filename), JSON.stringify(data, null, 2), "utf-8");
}

// =====================================================
// Financial Data
// =====================================================

export interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertFinancialData(_sheets: any, _spreadsheetId: string, amendmentId: string, data: any): Promise<void> {
    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    
    // Deduplicate existing by ID
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }

    const currentRecord = recordMap.get(amendmentId);

    const record: FinancialRecord = {
        amendmentId,
        empenhado: data.empenhado !== undefined ? String(data.empenhado) : (currentRecord?.empenhado || ""),
        liquidado: data.liquidado !== undefined ? String(data.liquidado) : (currentRecord?.liquidado || ""),
        pago: data.pago !== undefined ? String(data.pago) : (currentRecord?.pago || ""),
        reservado: data.reservado !== undefined ? String(data.reservado) : (currentRecord?.reservado || ""),
        updatedAt: new Date().toISOString(),
    };

    recordMap.set(amendmentId, record);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
}

// =====================================================
// Amendment CRUD
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendAmendmentToSheet(amendment: any): Promise<any> {
    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    amendments.push(amendment);
    await writeJsonFile(AMENDMENTS_FILE, amendments);

    // Save financial data if present
    if (amendment.reservado || amendment.empenhado || amendment.liquidado || amendment.pago) {
        await upsertFinancialData(null, "", amendment.id, amendment);
    }

    return { success: true };
}

export async function deleteAmendmentFromSheet(id: string): Promise<boolean> {
    let deletedAny = false;

    // Delete from main amendments
    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const filteredAmendments = amendments.filter((a) => a.id !== id);
    if (filteredAmendments.length < amendments.length) {
        deletedAny = true;
        await writeJsonFile(AMENDMENTS_FILE, filteredAmendments);
    }

    // Delete from external amendments
    const external = await readJsonFile<Amendment>(EXTERNAL_FILE);
    const filteredExternal = external.filter((a) => a.id !== id);
    if (filteredExternal.length < external.length) {
        deletedAny = true;
        await writeJsonFile(EXTERNAL_FILE, filteredExternal);
    }

    // Delete from financial
    const financial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const filteredFinancial = financial.filter((r) => r.amendmentId !== id);
    if (filteredFinancial.length < financial.length) {
        await writeJsonFile(FINANCIAL_FILE, filteredFinancial);
    }

    if (!deletedAny) {
        throw new Error("Amendment not found");
    }

    return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAmendmentInSheet(id: string, amendment: any): Promise<boolean> {
    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const index = amendments.findIndex((a) => a.id === id);

    if (index === -1) {
        // Not found — append as new
        await appendAmendmentToSheet(amendment);
        return true;
    }

    amendments[index] = { ...amendments[index], ...amendment, id };
    await writeJsonFile(AMENDMENTS_FILE, amendments);

    // Update financial data if provided
    if (amendment.reservado !== undefined || amendment.empenhado !== undefined || amendment.liquidado !== undefined || amendment.pago !== undefined) {
        await upsertFinancialData(null, "", id, amendment);
    }

    return true;
}

export async function getAmendmentsFromSheet(): Promise<Amendment[]> {
    const mainAmendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const externalAmendments = await readJsonFile<Amendment>(EXTERNAL_FILE);
    const financialRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    // Merge financial data into amendments
    const mergeFinancial = (amendment: Amendment): Amendment => {
        const financial = financialRecords.find((r) => r.amendmentId === amendment.id);
        if (financial) {
            return {
                ...amendment,
                // If record exists in financial.json, it is the authority for these fields.
                // We only fall back to amendment.X if the financial record literally doesn't have the field.
                empenhado: financial.empenhado !== undefined ? financial.empenhado : amendment.empenhado,
                liquidado: financial.liquidado !== undefined ? financial.liquidado : amendment.liquidado,
                pago: financial.pago !== undefined ? financial.pago : amendment.pago,
                reservado: financial.reservado !== undefined ? financial.reservado : amendment.reservado,
            };
        }
        return amendment;
    };

    // Merge by ID (main overrides external if same ID)
    const resultMap = new Map<string, Amendment>();

    // Add external first
    for (const a of externalAmendments) {
        if (a.id) resultMap.set(a.id, mergeFinancial(a));
    }

    // Add main (overwrites external if same ID)
    for (const a of mainAmendments) {
        if (a.id) resultMap.set(a.id, mergeFinancial(a));
    }

    return Array.from(resultMap.values());
}

// =====================================================
// Dashboard Cards
// =====================================================

export interface DashboardCard {
    id: string;
    label: string;
    value: string;
    trend?: string;
    icon: string;
    color: string;
    description?: string;
    total?: string;
    order: number;
}

export async function getDashboardCards(): Promise<DashboardCard[]> {
    const cards = await readJsonFile<DashboardCard>(CARDS_FILE);
    return cards.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveDashboardCards(cards: DashboardCard[]): Promise<void> {
    const cardsWithOrder = cards.map((card, idx) => ({
        ...card,
        order: card.order ?? idx,
    }));
    await writeJsonFile(CARDS_FILE, cardsWithOrder);
}

// =====================================================
// Compatibility (not needed but kept for imports)
// =====================================================

export async function getAuthClient(): Promise<null> {
    return null;
}
