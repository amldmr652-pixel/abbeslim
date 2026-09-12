import { createBrowserClient } from '@supabase/ssr'
import { createClient as createBaseClient, type SupabaseClient } from '@supabase/supabase-js'

let clientInstance: SupabaseClient | any = null;

/**
 * Runtime'da platformu tespit eder.
 * Build-time env var'lara güvenmek yerine window objesinden kontrol eder.
 * Bu sayede Capacitor (APK) ve Tauri (EXE) WebView'larda
 * localStorage tabanlı auth kullanılır.
 */
function isNativeRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  // Tauri masaüstü uygulaması
  if ('__TAURI__' in window || '__TAURI_INTERNALS__' in window) return true;
  // Capacitor mobil uygulama
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;
  // Build-time env fallback
  if (process.env.NEXT_PUBLIC_IS_MOBILE === 'true') return true;
  if (process.env.NEXT_PUBLIC_IS_DESKTOP === 'true') return true;
  return false;
}

export function createClient() {
  if (clientInstance) return clientInstance;

  // Mobil (Capacitor) ve Masaüstü (Tauri) ortamları:
  // Cookie tabanlı SSR auth bu ortamlarda çalışmaz,
  // localStorage tabanlı auth kullanılmalı.
  if (isNativeRuntime()) {
    clientInstance = createBaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    )
  } else {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return clientInstance;
}
