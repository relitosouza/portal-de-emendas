import { NextRequest, NextResponse } from "next/server";
import { appendAmendmentToSheet, getAmendmentsFromSheet, deleteAmendmentFromSheet, updateAmendmentInSheet } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { isValidUUID, validatePaginationParams } from "@/lib/validation";
import { logApiError, logApiCall } from "@/lib/logger";

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get("limit");
        const offset = searchParams.get("offset");

        // Validate and parse pagination params
        const { limit: parsedLimit, offset: parsedOffset } = validatePaginationParams(limit, offset);

        const amendments = await getAmendmentsFromSheet();

        // Apply pagination
        const total = amendments.length;
        const paginatedAmendments = amendments.slice(parsedOffset, parsedOffset + parsedLimit);

        const response = {
            data: paginatedAmendments,
            pagination: {
                limit: parsedLimit,
                offset: parsedOffset,
                total,
                hasMore: parsedOffset + parsedLimit < total,
            },
        };

        logApiCall("GET", "/api/amendments", 200, Date.now() - startTime, {
            total,
            returned: paginatedAmendments.length,
        });
        return NextResponse.json(response);
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logApiError("GET", "/api/amendments", err);

        const message = err.message;
        if (message.includes("Missing")) {
            return NextResponse.json({ warning: "Missing Credentials", data: [], pagination: { limit: 20, offset: 0, total: 0, hasMore: false } });
        }
        return NextResponse.json({ error: "Failed to fetch amendments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await req.json();

        if (!body.objeto && !body.title) {
            logApiCall("POST", "/api/amendments", 400, Date.now() - startTime);
            return NextResponse.json({ error: "Missing required fields: objeto/title is required" }, { status: 400 });
        }

        const amendment = {
            ...body,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        try {
            await appendAmendmentToSheet(amendment);
            logApiCall("POST", "/api/amendments", 201, Date.now() - startTime);
            return NextResponse.json({ success: true, amendment }, { status: 201 });
        } catch (sheetError: unknown) {
            const err = sheetError instanceof Error ? sheetError : new Error(String(sheetError));
            logApiError("POST", "/api/amendments", err, { action: "append" });

            if (err.message.includes("Missing")) {
                logApiCall("POST", "/api/amendments", 201, Date.now() - startTime, { fallback: true });
                return NextResponse.json({
                    success: true,
                    amendment,
                    warning: "Data not saved to Sheet (Missing Credentials)."
                }, { status: 201 });
            }

            return NextResponse.json({ error: "Falha ao salvar dados" }, { status: 500 });
        }
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logApiError("POST", "/api/amendments", err);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const startTime = Date.now();
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            logApiCall("DELETE", "/api/amendments", 400, Date.now() - startTime);
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Validate UUID format
        if (!isValidUUID(id)) {
            logApiCall("DELETE", "/api/amendments", 400, Date.now() - startTime, { reason: "invalid_uuid" });
            return NextResponse.json({ error: "Invalid ID format: must be a valid UUID" }, { status: 400 });
        }

        try {
            await deleteAmendmentFromSheet(id);
            logApiCall("DELETE", "/api/amendments", 200, Date.now() - startTime);
            return NextResponse.json({ success: true });
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            const message = err.message;

            if (message.includes("Missing")) {
                logApiCall("DELETE", "/api/amendments", 200, Date.now() - startTime, { fallback: true });
                return NextResponse.json({ success: true, warning: "Missing Credentials" });
            }
            if (message.includes("Amendment not found") || message.includes("No data found")) {
                logApiCall("DELETE", "/api/amendments", 200, Date.now() - startTime, { notFound: true });
                return NextResponse.json({ success: true, warning: "Amendment not found in Sheets, but proceeding." });
            }

            logApiError("DELETE", "/api/amendments", err, { id });
            return NextResponse.json({ error: "Falha ao excluir" }, { status: 500 });
        }
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logApiError("DELETE", "/api/amendments", err);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const startTime = Date.now();
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await req.json();

        if (!body.id) {
            logApiCall("PUT", "/api/amendments", 400, Date.now() - startTime);
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Validate UUID format
        if (!isValidUUID(body.id)) {
            logApiCall("PUT", "/api/amendments", 400, Date.now() - startTime, { reason: "invalid_uuid" });
            return NextResponse.json({ error: "Invalid ID format: must be a valid UUID" }, { status: 400 });
        }

        try {
            await updateAmendmentInSheet(body.id, body);
            logApiCall("PUT", "/api/amendments", 200, Date.now() - startTime);
            return NextResponse.json({ success: true, amendment: body });
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            const message = err.message;

            if (message.includes("Amendment not found")) {
                logApiCall("PUT", "/api/amendments", 404, Date.now() - startTime, { notFound: true });
                return NextResponse.json({ error: "Amendment not found" }, { status: 404 });
            }

            logApiError("PUT", "/api/amendments", err, { id: body.id });
            return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
        }
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logApiError("PUT", "/api/amendments", err);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
