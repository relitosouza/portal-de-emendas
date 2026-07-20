import type { NextConfig } from "next";

// Validate storage configuration only in production
// In development, we use file-based storage, so REDIS_URL is optional
if (process.env.NODE_ENV === "production" && process.env.VERCEL && !process.env.REDIS_URL) {
  throw new Error(
    "FATAL: Running on Vercel without REDIS_URL configured. " +
    "All data writes will be silently lost, causing data corruption. " +
    "Please configure REDIS_URL in your Vercel environment variables."
  );
}

const nextConfig: NextConfig = {
  // Experimental: Use system TLS certificates for Google Fonts
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/projetos/relatorio-indicacoes",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        source: "/projetos/:id/relatorio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        source: "/projetos/:id/relatorio-indicacoes/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
};

export default nextConfig;
