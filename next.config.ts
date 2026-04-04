import type { NextConfig } from "next";

// Validate storage configuration at build/startup time
if (process.env.VERCEL && !process.env.REDIS_URL) {
  throw new Error(
    "FATAL: Running on Vercel without REDIS_URL configured. " +
    "All data writes will be silently lost, causing data corruption. " +
    "Please configure REDIS_URL in your Vercel environment variables."
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
