import {
    beginPublicRequest,
    publicJson,
    publicOptions,
} from "@/lib/public-api/http";
import { publicOpenApiDocument } from "@/lib/public-api/openapi";

export async function GET(request: Request) {
    const context = await beginPublicRequest(request);
    if (context instanceof Response) return context;
    return publicJson(request, context, publicOpenApiDocument, {
        cacheControl: "public, max-age=300, s-maxage=3600",
    });
}

export const OPTIONS = publicOptions;

