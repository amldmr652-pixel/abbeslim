import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isChecked: boolean;
  fetchUser: () => Promise<User | null>;
  setUser: (user: User | null, session?: Session | null) => void;
}

const getInitialAuth = () => {
  if (typeof window === 'undefined') return { user: null, session: null, isChecked: false };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token')) && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const user = parsed.user || parsed.currentSession?.user;
          const session = parsed.session || parsed.currentSession;
          if (user) {
            return { user, session: session || null, isChecked: true };
          }
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return { user: null, session: null, isChecked: false };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialAuth.user,
  session: initialAuth.session,
  isLoading: false,
  isChecked: initialAuth.isChecked,

  setUser: (user, session = null) => {
    set({ user, session, isChecked: true, isLoading: false });
  },

  fetchUser: async () => {
    const state = get();
    // Bellekte zaten kullanıcı varsa anında (0ms) dön
    if (state.isChecked && state.user) {
      return state.user;
    }

    try {
      const supabase = createClient();
      // getSession() hafıza/storage üzerinden anında döner (ağ gecikmesi yok)
      const { data: { session } } = await supabase.auth.getSession();
      
      const user = session?.user || null;
      set({ user, session: session || null, isChecked: true, isLoading: false });
      return user;
    } catch (err) {
      console.warn('Auth session kontrolü hatası:', err);
      set({ user: null, session: null, isChecked: true, isLoading: false });
      return null;
    }
  },
}));

// Tarayıcı ortamında başlatıldığı anda oturumu arka planda sessizce yükle
if (typeof window !== 'undefined') {
  try {
    const supabase = createClient();
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session?.user) {
        useAuthStore.setState({ user: session.user, session, isChecked: true });
      }
    });

    supabase.auth.onAuthStateChange((_event: any, session: any) => {
      useAuthStore.setState({
        user: session?.user || null,
        session: session || null,
        isChecked: true,
      });
    });
  } catch (e) {
    // SSR veya erken yükleme hatalarını yut
  }
}
