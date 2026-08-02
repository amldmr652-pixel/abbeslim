'use client';

/**
 * Mobil build'de API çağrılarını Vercel'e yönlendirir.
 * Web build'de relative path kullanır.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Mobil build veya harici API base url tanımlı ise Supabase auth token'ını ekle
  if (API_BASE_URL) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
  }

  return fetch(url, options);
}
