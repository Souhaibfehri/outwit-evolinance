import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Keep security headers via middleware or platform config; avoid global Set-Cookie here

  // Webpack configuration to handle large bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
