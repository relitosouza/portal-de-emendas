import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, verifyPassword } from "@/lib/auth";

// Simple in-memory rate limiter
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Muitas tentativas. Tente novamente em 15 minutos." },
                { status: 429 }
            );
        }

        const { email, password } = await req.json();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: "Credenciais de admin não configuradas no servidor." },
                { status: 500 }
            );
        }

        if (email === adminEmail && verifyPassword(password, adminPassword)) {
            const token = generateSessionToken();
            const response = NextResponse.json({ success: true });

            response.cookies.set("admin-session", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 8, // 8 horas
            });

            return response;
        }

        return NextResponse.json(
            { error: "E-mail ou senha incorretos." },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
