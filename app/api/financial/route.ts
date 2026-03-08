import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthClient, upsertFinancialData } from "@/lib/google-sheets";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, empenhado, liquidado, pago } = body;

        if (!amendmentId) {
            return NextResponse.json({ error: "amendmentId is required" }, { status: 400 });
        }

        const auth = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

        await upsertFinancialData(sheets, spreadsheetId, amendmentId, {
            empenhado: empenhado || "",
            liquidado: liquidado || "",
            pago: pago || "",
        });

        return NextResponse.json({ success: true });
    } catch {
        console.error("Error saving financial data");
        return NextResponse.json({ error: "Falha ao salvar dados financeiros" }, { status: 500 });
    }
}
