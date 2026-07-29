import crypto from "node:crypto";

import { logApiCall } from "../logger.ts";
import { checkRateLimit, getClientIp, type RateLimitResult } from "../rate-limit.ts";

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export interface PublicRequestContext {
    requestId: string;
    rateLimit: RateLimitResult;
    corsOrigin: string | null;
    method: string;
    path: string;
    startedAt: number;
}

function configuredOrigins(): Set<string> {
    return new Set(
        (process.env.PUBLIC_API_CORS_ORIGINS ?? "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
    );
}

function resolveCorsOrigin(request: Request): { allowed: boolean; origin: string | null } {
    const origin = request.headers.get("origin");
    if (!origin) return { allowed: true, origin: null };

    const requestOrigin = new URL(request.url).origin;
    const origins = configuredOrigins();
    if (origin === requestOrigin) return { allowed: true, origin };
    if (origins.has("*")) return { allowed: true, origin: "*" };
    return { allowed: origins.has(origin), origin: origins.has(origin) ? origin : null };
}

function rateLimitHeaders(result: RateLimitResult, limit = DEFAULT_LIMIT): Record<string, string> {
    const resetSeconds = Math.max(0, Math.ceil(result.retryAfterMs / 1000));
    return {
        "RateLimit-Limit": String(limit),
        "RateLimit-Remaining": String(result.remaining),
        "RateLimit-Reset": String(resetSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(resetSeconds),
    };
}

function corsHeaders(origin: string | null): Record<string, string> {
    if (!origin) return {};
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Accept, Content-Type, If-None-Match",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
    };
}

export function publicError(
    requestId: string,
    status: number,
    code: string,
    message: string,
    details?: string[],
    context?: PublicRequestContext,
): Response {
    const headers = {
        "Cache-Control": "no-store",
        ...(context ? rateLimitHeaders(context.rateLimit) : {}),
        ...(context ? corsHeaders(context.corsOrigin) : {}),
    };
    if (context) {
        logApiCall(context.method, context.path, status, Date.now() - context.startedAt, {
            requestId,
            rateLimitRemaining: context.rateLimit.remaining,
        });
    }
    return Response.json({
        error: {
            code,
            message,
            requestId,
            ...(details?.length ? { details } : {}),
        },
    }, { status, headers });
}

export async function beginPublicRequest(
    request: Request,
): Promise<PublicRequestContext | Response> {
    const startedAt = Date.now();
    const requestId = request.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();
    const requestUrl = new URL(request.url);
    const cors = resolveCorsOrigin(request);
    if (!cors.allowed) {
        logApiCall(request.method, requestUrl.pathname, 403, Date.now() - startedAt, { requestId });
        return publicError(requestId, 403, "CORS_ORIGIN_DENIED", "Origem não autorizada.");
    }

    const rateLimit = await checkRateLimit(
        `public-api:${getClientIp(request)}`,
        DEFAULT_LIMIT,
        DEFAULT_WINDOW_MS,
    );
    const context = {
        requestId,
        rateLimit,
        corsOrigin: cors.origin,
        method: request.method,
        path: requestUrl.pathname,
        startedAt,
    };
    if (!rateLimit.allowed) {
        const response = publicError(
            requestId,
            429,
            "RATE_LIMIT_EXCEEDED",
            "Limite de requisições excedido.",
            undefined,
            context,
        );
        response.headers.set("Retry-After", String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))));
        return response;
    }
    return context;
}

export function publicJson(
    request: Request,
    context: PublicRequestContext,
    body: unknown,
    options: { status?: number; cacheControl?: string } = {},
): Response {
    const serialized = JSON.stringify(body);
    const cacheRepresentation = JSON.stringify(body, (key, value) =>
        key === "generatedAt" || key === "requestId" ? undefined : value
    );
    const etag = `"${crypto.createHash("sha256").update(cacheRepresentation).digest("base64url")}"`;
    const headers = {
        "Cache-Control": options.cacheControl ?? DEFAULT_CACHE_CONTROL,
        ETag: etag,
        "X-Request-Id": context.requestId,
        ...rateLimitHeaders(context.rateLimit),
        ...corsHeaders(context.corsOrigin),
    };

    if (request.headers.get("if-none-match") === etag) {
        logApiCall(context.method, context.path, 304, Date.now() - context.startedAt, {
            requestId: context.requestId,
            rateLimitRemaining: context.rateLimit.remaining,
        });
        return new Response(null, { status: 304, headers });
    }
    logApiCall(context.method, context.path, options.status ?? 200, Date.now() - context.startedAt, {
        requestId: context.requestId,
        rateLimitRemaining: context.rateLimit.remaining,
    });
    return new Response(serialized, {
        status: options.status ?? 200,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    });
}

export function publicOptions(request: Request): Response {
    const cors = resolveCorsOrigin(request);
    if (!cors.allowed) {
        return publicError(crypto.randomUUID(), 403, "CORS_ORIGIN_DENIED", "Origem não autorizada.");
    }
    return new Response(null, {
        status: 204,
        headers: corsHeaders(cors.origin),
    });
}

export function publicMeta(requestId: string) {
    return {
        apiVersion: "1",
        generatedAt: new Date().toISOString(),
        requestId,
    };
}
