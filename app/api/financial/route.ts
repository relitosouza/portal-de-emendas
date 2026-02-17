import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthClient, upsertFinancialData } from "@/lib/google-sheets";

export async function POST(request: Request) {
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
    } catch (error) {
        console.error("Error saving financial data:", error);
        return NextResponse.json({ error: "Failed to save financial data" }, { status: 500 });
    }
}
