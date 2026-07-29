import { getAmendmentsFromSheet } from "@/lib/json-storage";
import {
    beginPublicRequest,
    publicError,
    publicJson,
    publicMeta,
    publicOptions,
} from "@/lib/public-api/http";
import { mapPublicAmendment } from "@/lib/public-api/mappers";
import { filterAndPaginateAmendments, parsePublicQuery } from "@/lib/public-api/service";

export async function GET(request: Request) {
    const context = await beginPublicRequest(request);
    if (context instanceof Response) return context;

    const parsed = parsePublicQuery(new URL(request.url).searchParams);
    if (!parsed.success) {
        return publicError(
            context.requestId,
            400,
            "INVALID_QUERY",
            "Parâmetros de consulta inválidos.",
            parsed.issues,
            context,
        );
    }

    try {
        const amendments = await getAmendmentsFromSheet();
        const page = filterAndPaginateAmendments(amendments, parsed.data);
        return publicJson(request, context, {
            data: page.items.map(mapPublicAmendment),
            pagination: {
                limit: parsed.data.limit,
                nextCursor: page.nextCursor,
            },
            meta: publicMeta(context.requestId),
        });
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CURSOR") {
            return publicError(
                context.requestId,
                400,
                "INVALID_CURSOR",
                "Cursor inválido ou expirado.",
                undefined,
                context,
            );
        }
        console.error("[public-api] Falha ao listar emendas", { requestId: context.requestId, error });
        return publicError(
            context.requestId,
            500,
            "INTERNAL_ERROR",
            "Não foi possível consultar as emendas.",
            undefined,
            context,
        );
    }
}

export const OPTIONS = publicOptions;

