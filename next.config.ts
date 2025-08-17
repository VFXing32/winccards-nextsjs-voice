import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for Cloudflare Workers (no image optimizer)
  },
  eslint: {
    ignoreDuringBuilds: true, // Allows build to pass even if ESLint errors
  },
};

export default nextConfig;