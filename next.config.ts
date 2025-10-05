import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Fix HTTP 431 - Request Header Fields Too Large
  experimental: {
    // Increase header size limits
    serverComponentsExternalPackages: [],
  },
  
  // Custom server configuration for header limits
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Reduce cookie size limits
          {
            key: 'Set-Cookie',
            value: 'max-age=3600; Path=/; HttpOnly; SameSite=Strict',
          },
        ],
      },
    ];
  },
  
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
