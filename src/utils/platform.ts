'use client';

/**
 * Platform algılama utility'si
 * Web, masaüstü (Tauri) veya mobil (Capacitor) ortamını tespit eder
 */

export type Platform = 'web' | 'desktop' | 'android';

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';
  
  // Tauri masaüstü uygulaması
  if ('__TAURI__' in window || '__TAURI_INTERNALS__' in window) return 'desktop';
  
  // Capacitor mobil uygulama
  if ((window as any).Capacitor?.isNativePlatform?.()) return 'android';
  
  return 'web';
}

export const isDesktop = (): boolean => getPlatform() === 'desktop';
export const isAndroid = (): boolean => getPlatform() === 'android';
export const isWeb = (): boolean => getPlatform() === 'web';
export const isNativeApp = (): boolean => getPlatform() !== 'web';
