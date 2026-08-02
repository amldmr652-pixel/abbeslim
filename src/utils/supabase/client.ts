import { createBrowserClient } from '@supabase/ssr'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export function createClient() {
  if (process.env.NEXT_PUBLIC_IS_MOBILE === 'true') {
    return createBaseClient(
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
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
