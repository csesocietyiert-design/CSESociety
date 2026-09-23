import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/homepage/index.html',
        },
      ],
    };
  },
};

export default nextConfig;
