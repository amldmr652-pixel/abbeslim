'use client';

/**
 * Mobil build'de API çağrılarını Vercel'e yönlendirir.
 * Web build'de relative path kullanır.
 * Bearer auth token ve credentials'ı otomatik ekler.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});

  try {
    const { useAuthStore } = await import('@/stores/useAuthStore');
    let token = useAuthStore.getState().session?.access_token;

    if (!token) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (e) {
    // Ignore session fetch errors
  }

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
}
