/**
 * In-memory rate limiter with sliding window algorithm.
 * Tracks requests per IP address.
 */

import crypto from "crypto";
import Redis from "ioredis";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

type RateLimitGlobal = typeof globalThis & {
    __portalRateLimitRedis?: Redis;
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

function getRateLimitRedis(): Redis | null {
    if (!process.env.REDIS_URL) return null;

    const globalStore = globalThis as RateLimitGlobal;
    if (!globalStore.__portalRateLimitRedis) {
        globalStore.__portalRateLimitRedis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            connectTimeout: 2000,
            commandTimeout: 2000,
        });
    }

    return globalStore.__portalRateLimitRedis;
}

function hashIdentifier(identifier: string): string {
    return crypto.createHash("sha256").update(identifier).digest("hex");
}

function checkMemoryRateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const allowed = isRateLimited(identifier, limit, windowMs);
    return {
        allowed,
        remaining: getRemainingRequests(identifier, limit, windowMs),
        retryAfterMs: allowed ? 0 : getRateLimitResetTime(identifier),
    };
}

/**
 * Persistent fixed-window limiter in production (Redis), with an in-memory
 * fallback for local development or a temporary Redis outage.
 */
export async function checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number = 60000
): Promise<RateLimitResult> {
    const redis = getRateLimitRedis();
    if (!redis) return checkMemoryRateLimit(identifier, limit, windowMs);

    const key = `portal:rate-limit:${hashIdentifier(identifier)}`;
    const script = `
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then
            redis.call('PEXPIRE', KEYS[1], ARGV[1])
        end
        local ttl = redis.call('PTTL', KEYS[1])
        return {count, ttl}
    `;

    try {
        const result = (await redis.eval(script, 1, key, windowMs)) as [number, number];
        const count = Number(result[0]);
        const ttl = Math.max(0, Number(result[1]));
        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            retryAfterMs: count <= limit ? 0 : ttl,
        };
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[rate-limit] Redis indisponível; usando proteção local.", error);
        }
        return checkMemoryRateLimit(identifier, limit, windowMs);
    }
}

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
    const secondsUntilReset = Math.max(1, Math.ceil(resetTime / 1000));
    return Response.json(
        {
            error: `Muitas requisições. Tente novamente em ${secondsUntilReset} segundo(s).`,
        },
        {
            status: 429,
            headers: {
                "Retry-After": secondsUntilReset.toString(),
                "Cache-Control": "no-store",
            },
        }
    );
}
