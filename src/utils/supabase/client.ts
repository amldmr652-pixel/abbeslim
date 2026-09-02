import { createBrowserClient } from '@supabase/ssr'
import { createClient as createBaseClient, type SupabaseClient } from '@supabase/supabase-js'

let clientInstance: SupabaseClient | any = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  // Mobil (Capacitor) ve Masaüstü (Tauri) ortamları:
  // Cookie tabanlı SSR auth bu ortamlarda çalışmaz,
  // localStorage tabanlı auth kullanılmalı.
  if (
    process.env.NEXT_PUBLIC_IS_MOBILE === 'true' ||
    process.env.NEXT_PUBLIC_IS_DESKTOP === 'true'
  ) {
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
