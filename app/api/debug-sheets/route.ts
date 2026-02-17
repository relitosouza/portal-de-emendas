import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
    const result: Record<string, unknown> = {
        env: {
            hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "NOT SET",
            hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
            keyLength: process.env.GOOGLE_PRIVATE_KEY?.length ?? 0,
            keyStart: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 40) ?? "NOT SET",
            hasSheetId: !!process.env.GOOGLE_SHEET_ID,
            sheetId: process.env.GOOGLE_SHEET_ID ?? "NOT SET",
        },
    };

    try {
        let key = process.env.GOOGLE_PRIVATE_KEY ?? "";
        if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
        key = key.replace(/\\n/g, "\n");

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: key,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        result.connection = "OK";
        result.spreadsheetTitle = meta.data.properties?.title;
        result.sheets = meta.data.sheets?.map((s) => s.properties?.title);
    } catch (err: unknown) {
        const error = err as Error & { code?: number; status?: number };
        result.connection = "FAILED";
        result.error = {
            message: error.message,
            code: error.code,
            status: error.status,
        };
    }

    return NextResponse.json(result);
}
