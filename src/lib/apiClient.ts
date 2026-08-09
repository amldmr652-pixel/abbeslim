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

  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      options.headers = {
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      };
    }
  } catch (e) {
    // Ignore session fetch errors
  }

  return fetch(url, options);
}
