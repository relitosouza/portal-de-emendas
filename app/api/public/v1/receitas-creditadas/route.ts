import {
    CREDITED_REVENUES_FILE,
    type CreditedRevenue,
    readJsonFile,
} from "@/lib/json-storage";
import {
    beginPublicRequest,
    publicError,
    publicJson,
    publicMeta,
    publicOptions,
} from "@/lib/public-api/http";
import { mapPublicRevenue } from "@/lib/public-api/mappers";

function parseQuery(searchParams: URLSearchParams) {
    const allowed = new Set(["limit", "cursor"]);
    const unknown = [...searchParams.keys()].filter((key) => !allowed.has(key));
    const limitText = searchParams.get("limit") ?? "20";
    const limit = Number(limitText);
    if (unknown.length || !/^\d+$/.test(limitText) || limit < 1 || limit > 100) return null;
    return { limit, cursor: searchParams.get("cursor") };
}

export async function GET(request: Request) {
    const context = await beginPublicRequest(request);
    if (context instanceof Response) return context;
    const query = parseQuery(new URL(request.url).searchParams);
    if (!query) {
        return publicError(context.requestId, 400, "INVALID_QUERY", "Parâmetros de consulta inválidos.", undefined, context);
    }

    try {
        const revenues = (await readJsonFile<CreditedRevenue>(CREDITED_REVENUES_FILE))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id));
        let start = 0;
        if (query.cursor) {
            const cursorIndex = revenues.findIndex((item) => item.id === query.cursor);
            if (cursorIndex === -1) {
                return publicError(context.requestId, 400, "INVALID_CURSOR", "Cursor inválido ou expirado.", undefined, context);
            }
            start = cursorIndex + 1;
        }
        const items = revenues.slice(start, start + query.limit);
        const nextCursor = start + query.limit < revenues.length && items.length
            ? items[items.length - 1].id
            : null;
        return publicJson(request, context, {
            data: items.map(mapPublicRevenue),
            pagination: { limit: query.limit, nextCursor },
            meta: publicMeta(context.requestId),
        });
    } catch (error) {
        console.error("[public-api] Falha ao consultar receitas", { requestId: context.requestId, error });
        return publicError(context.requestId, 500, "INTERNAL_ERROR", "Não foi possível consultar as receitas.", undefined, context);
    }
}

export const OPTIONS = publicOptions;

