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
};

export default nextConfig;
