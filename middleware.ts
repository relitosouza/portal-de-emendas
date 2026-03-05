import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const session = request.cookies.get("admin-session");

    if (!session || session.value !== "authenticated") {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/dashboard/:path*", "/admin/wizard/:path*", "/admin/amendments/:path*", "/admin/cards/:path*"],
};
