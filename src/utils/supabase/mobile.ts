import { createClient } from '@supabase/supabase-js';

export function createMobileClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Capacitor WebView'da localStorage kullanır
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
}
