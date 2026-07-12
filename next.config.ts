import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  // Server Actions için maksimum body boyutunu artır (örn: 100mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
