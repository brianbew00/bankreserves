// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Don't block Vercel builds on lint/type errors (optional safety net)
  eslint: {
    ignoreDuringBuilds: false, // set true if you want to bypass linting
  },
  typescript: {
    ignoreBuildErrors: false, // set true if strict typing blocks deploy
  },
  // ✅ No basePath, no output: "export" (those are only for GitHub Pages)
  reactStrictMode: true,
};

export default nextConfig;