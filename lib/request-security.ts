const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

function getExpectedOrigins(request: Request): Set<string> {
    const origins = new Set<string>();

    try {
        origins.add(new URL(request.url).origin);
    } catch {
        // A malformed request URL will be rejected when an Origin is present.
    }

    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host")?.trim();
    if (host) {
        const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
        const protocol = forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");
        origins.add(`${protocol}://${host}`);
    }

    return origins;
}

/**
 * Rejects state-changing browser requests sent from another site.
 * Requests without Origin/Sec-Fetch-Site are allowed for trusted server clients
 * (for example Vercel Cron), which still need their own authentication.
 */
export function requireTrustedOrigin(request: Request): Response | null {
    const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    if (fetchSite && !SAFE_FETCH_SITES.has(fetchSite)) {
        return Response.json({ error: "Origem da requisição não autorizada" }, { status: 403 });
    }

    const origin = request.headers.get("origin");
    if (!origin) return null;

    let normalizedOrigin: string;
    try {
        normalizedOrigin = new URL(origin).origin;
    } catch {
        return Response.json({ error: "Origem da requisição inválida" }, { status: 403 });
    }

    if (!getExpectedOrigins(request).has(normalizedOrigin)) {
        return Response.json({ error: "Origem da requisição não autorizada" }, { status: 403 });
    }

    return null;
}
