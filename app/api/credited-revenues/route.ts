import { NextRequest, NextResponse } from "next/server";
import {
    CREDITED_REVENUES_FILE,
    CreditedRevenue,
    readJsonFile,
} from "@/lib/json-storage";

function omitVinculoDescription(revenue: CreditedRevenue) {
    const publicRevenue: Partial<CreditedRevenue> = { ...revenue };
    delete publicRevenue.vinculoDescription;
    return publicRevenue;
}

export async function GET(request: NextRequest) {
    const revenues = await readJsonFile<CreditedRevenue>(CREDITED_REVENUES_FILE);
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
        const revenue = revenues.find((item) => item.id === id);
        if (!revenue) {
            return NextResponse.json({ error: "Emenda creditada não encontrada" }, { status: 404 });
        }
        return NextResponse.json(omitVinculoDescription(revenue));
    }

    const total = revenues.reduce((sum, item) => sum + item.creditedValue, 0);
    return NextResponse.json({
        data: revenues.map(omitVinculoDescription),
        total,
        count: revenues.length,
    });
}
