import type { NextConfig } from 'next';
import dotenv from 'dotenv';
import path from 'path';

const isMobile = process.env.BUILD_TARGET === 'mobile';

if (isMobile) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.mobile'), override: true });
}

const nextConfig: NextConfig = {
  // Mobil build için static export
  ...(isMobile ? { output: 'export' } : {}),

  // Mobil build'de next/image optimizasyonu kapatılmalı
  images: {
    unoptimized: isMobile,
  },

  turbopack: {},

  // Server Actions için maksimum body boyutunu artır (örn: 100mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  // Mobil build'de trailing slash gerekli (Capacitor routing)
  ...(isMobile ? { trailingSlash: true } : {}),
};

export default nextConfig;
