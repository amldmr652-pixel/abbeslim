import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isChecked: boolean;
  fetchUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isChecked: false,

  fetchUser: async () => {
    // Zaten kontrol edildiyse ve user varsa, cache'ten dön
    const state = get();
    if (state.isChecked && state.user) {
      return state.user;
    }

    // İlk kez veya user yoksa fetch yap
    if (state.isLoading) {
      // Zaten bir fetch devam ediyorsa, bitmesini bekle
      return new Promise((resolve) => {
        const unsub = useAuthStore.subscribe((s) => {
          if (!s.isLoading) {
            unsub();
            resolve(s.user);
          }
        });
      });
    }

    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, isLoading: false, isChecked: true });
      return user;
    } catch {
      set({ user: null, isLoading: false, isChecked: true });
      return null;
    }
  },
}));
