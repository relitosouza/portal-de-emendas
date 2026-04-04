import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CsrfToken {
    token: string;
    timestamp: number;
}

/**
 * Generate a new CSRF token.
 */
function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a CSRF token with timestamp for validation.
 */
function createToken(): CsrfToken {
    return {
        token: generateToken(),
        timestamp: Date.now(),
    };
}

/**
 * Generate and set CSRF token in cookie.
 * Call this in GET handlers to set the token for forms.
 */
export async function generateCsrfToken(): Promise<string> {
    const csrfData = createToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, JSON.stringify(csrfData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_VALIDITY_MS / 1000,
        path: "/",
    });

    return csrfData.token;
}

/**
 * Validate CSRF token from request.
 * Call this in POST/PUT/DELETE handlers.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const cookieData = cookieStore.get(CSRF_COOKIE_NAME)?.value;

        if (!cookieData) {
            return false;
        }

        const csrfData = JSON.parse(cookieData) as CsrfToken;

        // Check token age
        const age = Date.now() - csrfData.timestamp;
        if (age > TOKEN_VALIDITY_MS) {
            return false;
        }

        // Get token from header
        const headerToken = request.headers.get(CSRF_HEADER_NAME);
        if (!headerToken) {
            return false;
        }

        // Constant-time comparison
        const cookieToken = Buffer.from(csrfData.token);
        const headerBuf = Buffer.from(headerToken);

        if (cookieToken.length !== headerBuf.length) {
            return false;
        }

        return crypto.timingSafeEqual(cookieToken, headerBuf);
    } catch {
        return false;
    }
}

/**
 * Middleware to check CSRF token for state-changing requests.
 */
export async function requireCsrfToken(request: Request): Promise<Response | null> {
    // Only validate POST, PUT, DELETE, PATCH
    const method = request.method.toUpperCase();
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        return null; // Don't validate GET requests
    }

    const isValid = await validateCsrfToken(request);
    if (!isValid) {
        return Response.json(
            { error: "Invalid or missing CSRF token" },
            { status: 403 }
        );
    }

    return null; // Token is valid, continue
}
