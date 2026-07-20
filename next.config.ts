import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://vlibras.gov.br`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://vlibras.gov.br wss:",
  "frame-src 'self' https://vlibras.gov.br",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob: https://vlibras.gov.br",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

// Fail closed on Vercel when a production secret or persistent storage is missing.
if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  const requiredVariables = [
    "REDIS_URL",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
    "CRON_SECRET",
  ] as const;
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(
      `FATAL: Missing required Vercel environment variables: ${missingVariables.join(", ")}`
    );
  }

  if ((process.env.ADMIN_PASSWORD?.length ?? 0) < 16) {
    throw new Error("FATAL: ADMIN_PASSWORD must contain at least 16 characters.");
  }
  if ((process.env.ADMIN_SESSION_SECRET?.length ?? 0) < 32) {
    throw new Error("FATAL: ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  if ((process.env.CRON_SECRET?.length ?? 0) < 32) {
    throw new Error("FATAL: CRON_SECRET must contain at least 32 characters.");
  }
  if (process.env.ADMIN_SESSION_SECRET === process.env.CRON_SECRET) {
    throw new Error("FATAL: ADMIN_SESSION_SECRET and CRON_SECRET must be different secrets.");
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Experimental: Use system TLS certificates for Google Fonts
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, private" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/api/auth",
        headers: [{ key: "Cache-Control", value: "no-store, private" }],
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
