import { getAmendmentsFromSheet, getFinancialRecord } from "@/lib/json-storage";
import { isValidAmendmentId } from "@/lib/validation";
import {
    beginPublicRequest,
    publicError,
    publicJson,
    publicMeta,
    publicOptions,
} from "@/lib/public-api/http";
import { emptyPublicFinancial, mapPublicFinancial } from "@/lib/public-api/mappers";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    const context = await beginPublicRequest(request);
    if (context instanceof Response) return context;
    const { id } = await params;

    if (!isValidAmendmentId(id)) {
        return publicError(context.requestId, 400, "INVALID_ID", "Identificador inválido.", undefined, context);
    }

    try {
        const amendments = await getAmendmentsFromSheet();
        if (!amendments.some((item) => item.id === id)) {
            return publicError(context.requestId, 404, "NOT_FOUND", "Emenda não encontrada.", undefined, context);
        }
        const record = await getFinancialRecord(id);
        return publicJson(request, context, {
            data: record ? mapPublicFinancial(record) : emptyPublicFinancial(id),
            meta: publicMeta(context.requestId),
        });
    } catch (error) {
        console.error("[public-api] Falha ao consultar execução financeira", { requestId: context.requestId, error });
        return publicError(context.requestId, 500, "INTERNAL_ERROR", "Não foi possível consultar a execução financeira.", undefined, context);
    }
}

export const OPTIONS = publicOptions;

