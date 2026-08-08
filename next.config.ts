import type { NextConfig } from 'next';
import dotenv from 'dotenv';
import path from 'path';

const isMobile = process.env.BUILD_TARGET === 'mobile';
const isDesktop = process.env.BUILD_TARGET === 'desktop';
const isNativeApp = isMobile || isDesktop;

if (isMobile) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.mobile'), override: true });
} else if (isDesktop) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.desktop'), override: true });
}

const nextConfig: NextConfig = {
  // Mobil/Masaüstü native build için static export
  ...(isNativeApp ? { output: 'export' } : {}),

  // Native build'de next/image optimizasyonu kapatılmalı
  images: {
    unoptimized: isNativeApp,
  },

  turbopack: {},

  // Server Actions için maksimum body boyutunu artır (örn: 100mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  // Native build'de trailing slash gerekli (Capacitor/Tauri routing)
  ...(isNativeApp ? { trailingSlash: true } : {}),
};

export default nextConfig;
