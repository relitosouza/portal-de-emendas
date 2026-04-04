/**
 * In-memory rate limiter with sliding window algorithm.
 * Tracks requests per IP address.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if request exceeds rate limit.
 * @param identifier Unique identifier (IP, user ID, etc)
 * @param limit Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function isRateLimited(
    identifier: string,
    limit: number,
    windowMs: number = 60000 // 1 minute default
): boolean {
    const now = Date.now();
    const entry = store.get(identifier);

    // Clean up old entries to prevent memory leak
    if (entry && now > entry.resetTime) {
        store.delete(identifier);
        return isRateLimited(identifier, limit, windowMs); // Recursively check again
    }

    if (!entry) {
        store.set(identifier, { count: 1, resetTime: now + windowMs });
        return true; // First request is always allowed
    }

    if (entry.count >= limit) {
        return false; // Rate limit exceeded
    }

    entry.count++;
    return true; // Request allowed
}

/**
 * Get remaining requests for an identifier.
 */
export function getRemainingRequests(
    identifier: string,
    limit: number,
    windowMs: number = 60000
): number {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now > entry.resetTime) {
        return limit;
    }

    return Math.max(0, limit - entry.count);
}

/**
 * Get time until rate limit resets.
 */
export function getRateLimitResetTime(identifier: string): number {
    const entry = store.get(identifier);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
}

/**
 * Extract client IP from request.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Create a rate limit response (429 Too Many Requests).
 */
export function createRateLimitResponse(resetTime: number) {
    const secondsUntilReset = Math.ceil(resetTime / 1000);
    return Response.json(
        {
            error: `Rate limit exceeded. Try again in ${secondsUntilReset} second(s).`,
        },
        {
            status: 429,
            headers: {
                "Retry-After": secondsUntilReset.toString(),
            },
        }
    );
}
