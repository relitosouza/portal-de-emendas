import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: "Credenciais de admin não configuradas no servidor." },
                { status: 500 }
            );
        }

        if (email === adminEmail && password === adminPassword) {
            const response = NextResponse.json({ success: true });

            response.cookies.set("admin-session", "authenticated", {
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
