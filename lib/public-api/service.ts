import type { Amendment } from "../store.ts";
import { publicQuerySchema, type PublicQuery } from "./schemas.ts";

type QueryParseResult =
    | { success: true; data: PublicQuery }
    | { success: false; issues: string[] };

export function parsePublicQuery(searchParams: URLSearchParams): QueryParseResult {
    const accepted = ["ano", "autor", "categoria", "status", "municipio", "limit", "cursor"];
    const unknown = [...searchParams.keys()].filter((key) => !accepted.includes(key));
    if (unknown.length > 0) {
        return { success: false, issues: unknown.map((key) => `Parâmetro desconhecido: ${key}`) };
    }

    const raw = Object.fromEntries(
        accepted
            .filter((key) => searchParams.has(key))
            .map((key) => [key, searchParams.get(key)])
    );
    const parsed = publicQuerySchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        };
    }
    return { success: true, data: parsed.data };
}

function normalize(value: unknown): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}

function getYear(amendment: Amendment): number | null {
    for (const value of [amendment.year, amendment.numeroEmenda, amendment.createdAt]) {
        const match = typeof value === "string" ? /(19|20|21)\d{2}/.exec(value) : null;
        if (match) return Number(match[0]);
    }
    return null;
}

function encodeCursor(amendment: Amendment): string {
    return Buffer.from(JSON.stringify({
        createdAt: amendment.createdAt || "",
        id: amendment.id,
    })).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
    try {
        const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (typeof value?.createdAt !== "string" || typeof value?.id !== "string") return null;
        return value;
    } catch {
        return null;
    }
}

export interface AmendmentPage {
    items: Amendment[];
    nextCursor: string | null;
}

export function filterAndPaginateAmendments(
    amendments: Amendment[],
    query: PublicQuery,
): AmendmentPage {
    const filtered = amendments.filter((amendment) => {
        if (query.ano && getYear(amendment) !== query.ano) return false;
        if (query.autor && !normalize(amendment.autor || amendment.author).includes(normalize(query.autor))) return false;
        if (query.categoria && normalize(amendment.categoria) !== normalize(query.categoria)) return false;
        if (query.status && normalize(amendment.status) !== normalize(query.status)) return false;
        if (query.municipio && normalize(amendment.municipio) !== normalize(query.municipio)) return false;
        return true;
    }).sort((a, b) => {
        const dateOrder = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        return dateOrder || String(b.id).localeCompare(String(a.id));
    });

    let start = 0;
    if (query.cursor) {
        const decoded = decodeCursor(query.cursor);
        if (!decoded) throw new Error("INVALID_CURSOR");
        const index = filtered.findIndex(
            (item) => item.id === decoded.id && (item.createdAt || "") === decoded.createdAt
        );
        if (index === -1) throw new Error("INVALID_CURSOR");
        start = index + 1;
    }

    const items = filtered.slice(start, start + query.limit);
    const hasMore = start + query.limit < filtered.length;
    return {
        items,
        nextCursor: hasMore && items.length > 0 ? encodeCursor(items[items.length - 1]) : null,
    };
}

