import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure for Replit proxy environment
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['*'],
  })
};

export default nextConfig;
