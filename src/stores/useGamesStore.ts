import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

interface GamesState {
  timePlayedToday: number; // in seconds
  lastPlayedDate: string;  // YYYY-MM-DD
  dailyLimit: number;      // 15 mins = 900 seconds
  gameStats: Record<string, number>; // gameId -> seconds played total
  incrementTime: (gameId?: string) => void;
  checkAndResetDaily: () => void;
  isLimitReached: () => boolean;
  resetTime: () => void;
  fetchCloudTime: () => Promise<void>;
  syncCloudTime: () => Promise<void>;
}

let syncTimeout: any = null;

export const useGamesStore = create<GamesState>()(
  persist(
    (set, get) => ({
      timePlayedToday: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      dailyLimit: 900, // 15 minutes
      gameStats: {},

      incrementTime: (gameId?: string) => {
        get().checkAndResetDaily();
        set((state) => {
          const newStats = { ...state.gameStats };
          if (gameId) {
            newStats[gameId] = (newStats[gameId] || 0) + 1;
          }
          return { 
            timePlayedToday: state.timePlayedToday + 1,
            gameStats: newStats
          };
        });

        // Debounced sync to Supabase every 5 seconds
        if (!syncTimeout) {
          syncTimeout = setTimeout(() => {
            syncTimeout = null;
            get().syncCloudTime();
          }, 5000);
        }
      },

      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        if (get().lastPlayedDate !== today) {
          set({ timePlayedToday: 0, lastPlayedDate: today });
        }
      },

      isLimitReached: () => {
        get().checkAndResetDaily();
        return get().timePlayedToday >= get().dailyLimit;
      },

      resetTime: () => {
        set({ timePlayedToday: 0 });
        get().syncCloudTime();
      },

      fetchCloudTime: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const today = new Date().toISOString().split('T')[0];
          const { data } = await supabase
            .from('game_sessions')
            .select('time_played_seconds')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

          if (data && typeof data.time_played_seconds === 'number') {
            const currentLocal = get().timePlayedToday;
            const remoteTime = data.time_played_seconds;
            set({
              timePlayedToday: Math.max(currentLocal, remoteTime),
              lastPlayedDate: today
            });
          }
        } catch (e) {
          console.warn('Oyun süresi senkronize edilemedi:', e);
        }
      },

      syncCloudTime: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const today = get().lastPlayedDate;
          const seconds = get().timePlayedToday;

          await supabase
            .from('game_sessions')
            .upsert({
              user_id: user.id,
              date: today,
              time_played_seconds: seconds,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,date' });
        } catch (e) {
          console.warn('Oyun süresi kaydedilemedi:', e);
        }
      }
    }),
    {
      name: 'lifeos-games-storage',
    }
  )
);
