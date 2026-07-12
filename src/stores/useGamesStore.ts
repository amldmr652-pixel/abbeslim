import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GamesState {
  timePlayedToday: number; // in seconds
  lastPlayedDate: string;  // YYYY-MM-DD
  dailyLimit: number;      // 15 mins = 900 seconds
  incrementTime: () => void;
  checkAndResetDaily: () => void;
  isLimitReached: () => boolean;
}

export const useGamesStore = create<GamesState>()(
  persist(
    (set, get) => ({
      timePlayedToday: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      dailyLimit: 900, // 15 minutes

      incrementTime: () => {
        get().checkAndResetDaily();
        set((state) => ({ timePlayedToday: state.timePlayedToday + 1 }));
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
      }
    }),
    {
      name: 'lifeos-games-storage',
    }
  )
);
