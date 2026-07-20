import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, verifyPassword } from "@/lib/auth";
import crypto from "crypto";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { requireTrustedOrigin } from "@/lib/request-security";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const PENALTY_COOKIE = "login-penalty";

function getPenaltySecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) {
        // In production (Vercel), require the secret to be set
        if (process.env.VERCEL || process.env.NODE_ENV === "production") {
            throw new Error(
                "Missing required environment variable: ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be set"
            );
        }
        // In development, use a development-only fallback
        return "dev-fallback-secret-change-in-production";
    }
    return secret;
}

function signPenalty(payload: string): string {
    return crypto.createHmac("sha256", getPenaltySecret()).update(payload).digest("hex");
}

function readPenaltyCookie(req: NextRequest): { count: number; blockedUntil: number } | null {
    const raw = req.cookies.get(PENALTY_COOKIE)?.value;
    if (!raw) return null;
    try {
        const [data, sig] = raw.split("|");
        if (signPenalty(data) !== sig) return null;
        return JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch {
        return null;
    }
}

function makePenaltyCookieValue(count: number, blockedUntil: number): string {
    const data = Buffer.from(JSON.stringify({ count, blockedUntil })).toString("base64");
    return `${data}|${signPenalty(data)}`;
}

function setPenaltyCookie(response: NextResponse, count: number, blockedUntil: number) {
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set(PENALTY_COOKIE, makePenaltyCookieValue(count, blockedUntil), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/api/auth",
        maxAge: BLOCK_DURATION_MS / 1000,
    });
}

export async function POST(req: NextRequest) {
    try {
        const originError = requireTrustedOrigin(req);
        if (originError) return originError;

        const contentLength = Number(req.headers.get("content-length") || 0);
        if (contentLength > 4096) {
            return NextResponse.json({ error: "Requisição muito grande." }, { status: 413 });
        }

        const clientIp = getClientIp(req);
        const ipLimit = await checkRateLimit(`admin-login:ip:${clientIp}`, 20, BLOCK_DURATION_MS);
        if (!ipLimit.allowed) return createRateLimitResponse(ipLimit.retryAfterMs);

        const penalty = readPenaltyCookie(req);
        const now = Date.now();

        // Block if still within penalty window
        if (penalty && penalty.blockedUntil > now) {
            const minutesLeft = Math.ceil((penalty.blockedUntil - now) / 60000);
            return NextResponse.json(
                { error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).` },
                { status: 429 }
            );
        }

        const { email, password } = await req.json();

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            email.length > 254 ||
            password.length > 256
        ) {
            return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: "Credenciais de admin não configuradas no servidor." },
                { status: 500 }
            );
        }

        const credentialsMatch =
            normalizedEmail === adminEmail.trim().toLowerCase() && verifyPassword(password, adminPassword);

        if (credentialsMatch) {
            const token = generateSessionToken();
            const response = NextResponse.json({ success: true });

            response.cookies.set("admin-session", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60 * 8,
            });

            // Clear penalty cookie on successful login
            response.cookies.delete(PENALTY_COOKIE);

            return response;
        }

        const accountLimit = await checkRateLimit(
            `admin-login:account:${normalizedEmail}`,
            8,
            BLOCK_DURATION_MS
        );
        if (!accountLimit.allowed) return createRateLimitResponse(accountLimit.retryAfterMs);

        // Increment failure count
        const currentCount = (penalty?.count ?? 0) + 1;
        const blockedUntil = currentCount >= MAX_ATTEMPTS ? now + BLOCK_DURATION_MS : 0;

        const response = NextResponse.json(
            { error: "E-mail ou senha incorretos." },
            { status: 401 }
        );
        setPenaltyCookie(response, currentCount, blockedUntil);
        return response;

    } catch {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
