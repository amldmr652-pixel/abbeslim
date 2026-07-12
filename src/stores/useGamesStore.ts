import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GamesState {
  timePlayedToday: number; // in seconds
  lastPlayedDate: string;  // YYYY-MM-DD
  dailyLimit: number;      // 15 mins = 900 seconds
  gameStats: Record<string, number>; // gameId -> seconds played total
  incrementTime: (gameId?: string) => void;
  checkAndResetDaily: () => void;
  isLimitReached: () => boolean;
}

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
