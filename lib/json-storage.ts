import fs from "fs/promises";
import path from "path";
import Redis from "ioredis";
import { Amendment } from "@/lib/store";
import { parseCurrency } from "./amendments-utils";

// =====================================================
// Storage Strategy
// =====================================================

const IS_VERCEL = !!process.env.VERCEL;
const HAS_REDIS = !!process.env.REDIS_URL;
const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

let _redis: Redis | null = null;
function getRedis(): Redis {
    if (!_redis) {
        if (!process.env.REDIS_URL) {
            throw new Error(
                "REDIS_URL environment variable is required for Vercel deployments. " +
                "Without it, data writes will fail and cause data loss."
            );
        }
        _redis = new Redis(process.env.REDIS_URL, {
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
        });
    }
    return _redis;
}

/**
 * Validate storage configuration at startup.
 * Throws an error if the configuration is invalid for the current environment.
 */
export function validateStorageConfig(): void {
    if (IS_VERCEL && !HAS_REDIS) {
        throw new Error(
            "FATAL: Running on Vercel without REDIS_URL configured. " +
            "All data writes will be silently lost, causing data corruption. " +
            "Please configure REDIS_URL in your Vercel environment variables."
        );
    }
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
    if (IS_VERCEL && HAS_REDIS) {
        try {
            const raw = await getRedis().get(filenameToKey(filename));
            if (raw) return JSON.parse(raw) as T[];
            // KV vazio — fallback para bundle do deploy (primeira vez após deploy)
        } catch (err) {
            console.error(`[json-storage] Redis read failed for "${filename}":`, err);
        }
    }
    // Dev local ou Vercel sem Redis: lê do bundle (read-only)
    try {
        const content = await fs.readFile(bundledPath(filename), "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    if (IS_VERCEL && HAS_REDIS) {
        try {
            await getRedis().set(filenameToKey(filename), JSON.stringify(data));
            return;
        } catch (err) {
            console.error(`[json-storage] Redis write failed for "${filename}":`, err);
            throw err;
        }
    }
    if (IS_VERCEL && !HAS_REDIS) {
        // This should never happen if validateStorageConfig() is called at startup
        throw new Error(
            `Storage write failed: Running on Vercel without REDIS_URL configured. ` +
            `File: "${filename}". Data would be lost. Check your environment variables.`
        );
    }
    // Dev local: escreve no disco
    await fs.mkdir(BUNDLED_DATA_DIR, { recursive: true });
    await fs.writeFile(bundledPath(filename), JSON.stringify(data, null, 2), "utf-8");
}

// =====================================================
// Concurrency Control (Optimistic Locking with Retry)
// =====================================================

const RETRY_MAX_ATTEMPTS = 5;
const RETRY_INITIAL_DELAY_MS = 50;

/**
 * Execute a function with optimistic locking retry logic.
 * Catches conflicts and automatically retries with exponential backoff.
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = "operation"
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on non-conflict errors
            if (!lastError.message.includes("conflict") && !lastError.message.includes("concurrent")) {
                throw error;
            }

            if (attempt < RETRY_MAX_ATTEMPTS) {
                const delayMs = RETRY_INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError || new Error(`${operationName} failed after ${RETRY_MAX_ATTEMPTS} attempts`);
}

// =====================================================
// Financial Data
// =====================================================

export interface EmpenhoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    credor: string;
    processo: string;
    descricao: string;
    subEmpenho?: string;
    createdAt: string;
}

export interface LiquidacaoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    descricao: string;
    createdAt: string;
}

export interface PagamentoEvent {
    id: string;
    data: string;
    valor: string;
    banco: string;
    agencia: string;
    documento: string;
    ordemBancaria: string;
    descricao: string;
    createdAt: string;
}

export interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
    // Event history (undefined on old records — treat as [])
    empenhos?: EmpenhoEvent[];
    liquidacoes?: LiquidacaoEvent[];
    pagamentos?: PagamentoEvent[];
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
        // Preserve event arrays from existing record
        empenhos: currentRecord?.empenhos,
        liquidacoes: currentRecord?.liquidacoes,
        pagamentos: currentRecord?.pagamentos,
    };

    recordMap.set(amendmentId, record);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
}

function sumEvents(events: Array<{ valor: string }> = []): string {
    const total = events.reduce((acc, e) => {
        return acc + parseCurrency(e.valor);
    }, 0);
    if (total === 0) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total);
}

export type FinancialEventType = "empenho" | "liquidacao" | "pagamento";

export async function addFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    return withRetry(async () => {
        const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
        const recordMap = new Map<string, FinancialRecord>();
        for (const r of rawRecords) {
            if (r.amendmentId) recordMap.set(r.amendmentId, r);
        }

        const current = recordMap.get(amendmentId) ?? {
            amendmentId,
            empenhado: "0",
            liquidado: "0",
            pago: "0",
            reservado: "0",
            updatedAt: new Date().toISOString(),
        };

        const newEvent = { ...eventData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

        const updated: FinancialRecord = {
            ...current,
            empenhos: tipo === "empenho" ? [...(current.empenhos ?? []), newEvent] : (current.empenhos ?? []),
            liquidacoes: tipo === "liquidacao" ? [...(current.liquidacoes ?? []), newEvent] : (current.liquidacoes ?? []),
            pagamentos: tipo === "pagamento" ? [...(current.pagamentos ?? []), newEvent] : (current.pagamentos ?? []),
            updatedAt: new Date().toISOString(),
        };

        // Recalculate totals
        updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
        updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
        updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;

        recordMap.set(amendmentId, updated);
        await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
        return updated;
    }, "addFinancialEvent");
}

export async function updateFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    return withRetry(async () => {
        const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
        const recordMap = new Map<string, FinancialRecord>();
        for (const r of rawRecords) {
            if (r.amendmentId) recordMap.set(r.amendmentId, r);
        }

        const current = recordMap.get(amendmentId);
        if (!current) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

        const replaceById = (arr: Array<{ id: string }> = []) =>
            arr.map((e) => (e.id === eventId ? { ...e, ...eventData, id: eventId } : e));

        const updated: FinancialRecord = {
            ...current,
            empenhos: tipo === "empenho" ? replaceById(current.empenhos) as EmpenhoEvent[] : current.empenhos,
            liquidacoes: tipo === "liquidacao" ? replaceById(current.liquidacoes) as LiquidacaoEvent[] : current.liquidacoes,
            pagamentos: tipo === "pagamento" ? replaceById(current.pagamentos) as PagamentoEvent[] : current.pagamentos,
            updatedAt: new Date().toISOString(),
        };

        updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
        updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
        updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;

        recordMap.set(amendmentId, updated);
        await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
        return updated;
    }, "updateFinancialEvent");
}

export async function deleteFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string
): Promise<FinancialRecord> {
    return withRetry(async () => {
        const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
        const recordMap = new Map<string, FinancialRecord>();
        for (const r of rawRecords) {
            if (r.amendmentId) recordMap.set(r.amendmentId, r);
        }

        const current = recordMap.get(amendmentId);
        if (!current) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

        const removeById = (arr: Array<{ id: string }> = []) => arr.filter((e) => e.id !== eventId);

        const updated: FinancialRecord = {
            ...current,
            empenhos: tipo === "empenho" ? removeById(current.empenhos) as EmpenhoEvent[] : current.empenhos,
            liquidacoes: tipo === "liquidacao" ? removeById(current.liquidacoes) as LiquidacaoEvent[] : current.liquidacoes,
            pagamentos: tipo === "pagamento" ? removeById(current.pagamentos) as PagamentoEvent[] : current.pagamentos,
            updatedAt: new Date().toISOString(),
        };

        updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
        updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
        updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;

        recordMap.set(amendmentId, updated);
        await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
        return updated;
    }, "deleteFinancialEvent");
}

export async function getFinancialRecord(amendmentId: string): Promise<FinancialRecord | null> {
    const records = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    return records.find((r) => r.amendmentId === amendmentId) ?? null;
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
                // Pass event history to amendment
                empenhos: financial.empenhos ?? [],
                liquidacoes: financial.liquidacoes ?? [],
                pagamentos: financial.pagamentos ?? [],
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
