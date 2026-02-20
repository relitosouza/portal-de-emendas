import { NextRequest, NextResponse } from "next/server";
import { appendAmendmentToSheet, getAmendmentsFromSheet } from "@/lib/google-sheets";

// ... (existing code)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        // Basic validation
        // Support both new (objeto) and old (title) formats
        if ((!body.objeto && !body.title)) {
            return NextResponse.json({ error: "Missing required fields: objeto/title is required" }, { status: 400 });
        }

        const amendment = {
            ...body,
            // Preserve caller-supplied ID when completing a pending amendment from the
            // "Emenda" (cadastro vereador) sheet; otherwise generate a fresh UUID.
            id: body.id || crypto.randomUUID(),
            createdAt: body.createdAt || new Date().toISOString(),
            // When publishing a previously-pending amendment, promote its status.
            status: body.status === "pendente" ? "planejamento" : (body.status || "planejamento"),
        };

        // Try to save to Google Sheets
        try {
            await appendAmendmentToSheet(amendment);
            return NextResponse.json({ success: true, amendment }, { status: 201 });
        } catch (sheetError: any) {
            console.error("Google Sheets Error during save:", sheetError);

            // Fallback for demo/development if credentials aren't set
            // ... (rest of fallback)
            if (sheetError.message.includes("Missing")) {
                console.warn("Falling back to simulated success for demo purposes (Credentials missing).");
                return NextResponse.json({
                    success: true,
                    amendment,
                    warning: "Data not saved to Sheet (Missing Credentials). Data is safe in local state for this session."
                }, { status: 201 });
            }

            return NextResponse.json({ error: "Failed to save to Sheet: " + sheetError.message }, { status: 500 });
        }

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const amendments = await getAmendmentsFromSheet();
        return NextResponse.json(amendments);
    } catch (error: any) {
        console.error("API GET Error:", error);
        // ... (rest of get)
        if (error.message.includes("Missing")) {
            return NextResponse.json({ warning: "Missing Credentials", data: [] });
        }
        return NextResponse.json({ error: "Failed to fetch amendments" }, { status: 500 });
    }
}

import { deleteAmendmentFromSheet } from "@/lib/google-sheets";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        try {
            await deleteAmendmentFromSheet(id);
            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error("Delete Error:", error);
            if (error.message.includes("Amendment not found")) {
                return NextResponse.json({ error: "Amendment not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to delete: " + error.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { updateAmendmentInSheet } from "@/lib/google-sheets";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        try {
            await updateAmendmentInSheet(body.id, body);
            return NextResponse.json({ success: true, amendment: body });
        } catch (error: any) {
            console.error("Update Error:", error);
            if (error.message.includes("Amendment not found")) {
                return NextResponse.json({ error: "Amendment not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to update: " + error.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
