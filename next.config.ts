import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/map', destination: '/', permanent: true },
      { source: '/map/new', destination: '/new', permanent: true },
    ]
  },
};

export default nextConfig;
