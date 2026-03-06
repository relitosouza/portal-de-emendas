import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch image, status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set("Content-Type", response.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=86400");
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(buffer, { headers });
    } catch (error) {
        console.error("Image proxy error:", error);
        return new NextResponse("Error proxying image", { status: 500 });
    }
}
