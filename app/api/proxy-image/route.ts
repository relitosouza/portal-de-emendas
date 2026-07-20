import { NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rate-limit";

const ALLOWED_HOSTS = [
    "lh3.googleusercontent.com",
    "drive.google.com",
    "docs.google.com",
    "storage.googleapis.com",
    "i.imgur.com",
    "images.unsplash.com",
    "upload.wikimedia.org",
];

/**
 * IPv4 ranges for private/internal networks (CIDR blocks).
 * IPv6 ranges use similar patterns but with colon notation.
 */
const BLOCKED_IP_RANGES = [
    // IPv4 localhost
    /^127\./,
    // IPv4 private
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    // IPv4 link-local
    /^169\.254\./,
    // IPv4 this network
    /^0\./,
    // IPv6 loopback
    /^::1$/,
    // IPv6 private (fd00::/8)
    /^[fF][dD][0-9a-fA-F]{2}:/,
    // IPv6 link-local (fe80::/10)
    /^[fF][eE][89aAbB][0-9a-fA-F]:/,
    // IPv6 unique local (fc00::/7)
    /^[fF][cCdD][0-9a-fA-F]{2}:/,
    // IPv6 multicast (ff00::/8)
    /^[fF]{2}[0-9a-fA-F]{2}:/,
    // Hostname localhost
    /^localhost$/i,
];

function isBlockedUrl(urlString: string): boolean {
    try {
        const parsed = new URL(urlString);

        // Only allow HTTPS
        if (parsed.protocol !== "https:") {
            return true;
        }

        const hostname = parsed.hostname;

        // Block private/internal IPs
        for (const pattern of BLOCKED_IP_RANGES) {
            if (pattern.test(hostname)) {
                return true;
            }
        }

        // Only allow known image hosts
        if (!ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith("." + host))) {
            return true;
        }

        return false;
    } catch {
        return true;
    }
}

export async function GET(request: Request) {
    const rateLimit = await checkRateLimit(`image-proxy:${getClientIp(request)}`, 120, 10 * 60 * 1000);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.retryAfterMs);

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    if (isBlockedUrl(url)) {
        return new NextResponse("URL not allowed", { status: 403 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            redirect: "error", // Do not follow redirects (prevents SSRF via redirect)
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return new NextResponse("Failed to fetch image", { status: 502 });
        }

        // Validate content type is actually an image
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            return new NextResponse("Response is not an image", { status: 400 });
        }

        // Limit response size to 10MB
        const contentLength = response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
            return new NextResponse("Image too large", { status: 413 });
        }

        const arrayBuffer = await response.arrayBuffer();

        // Double check size after download
        if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
            return new NextResponse("Image too large", { status: 413 });
        }

        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=86400");
        headers.set("X-Content-Type-Options", "nosniff");

        return new NextResponse(buffer, { headers });
    } catch {
        return new NextResponse("Error proxying image", { status: 500 });
    }
}
