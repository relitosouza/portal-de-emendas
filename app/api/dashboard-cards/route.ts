import { NextResponse } from "next/server";
import { getDashboardCards, saveDashboardCards, DashboardCard } from "@/lib/google-sheets";

export async function GET() {
    try {
        const cards = await getDashboardCards();
        return NextResponse.json(cards);
    } catch (error) {
        console.error("Error fetching dashboard cards:", error);
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cards: DashboardCard[] = body.cards;

        if (!Array.isArray(cards)) {
            return NextResponse.json({ error: "cards must be an array" }, { status: 400 });
        }

        await saveDashboardCards(cards);
        return NextResponse.json({ success: true, count: cards.length });
    } catch (error) {
        console.error("Error saving dashboard cards:", error);
        return NextResponse.json({ error: "Failed to save cards" }, { status: 500 });
    }
}
