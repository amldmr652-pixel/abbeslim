import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light' | 'amoled';

export interface WidgetPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BreakSound {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
}

const DEFAULT_BREAK_SOUNDS: BreakSound[] = [
  { id: 'forest', name: 'Orman Kuşları', url: '/sounds/forest.mp3' },
  { id: 'rain', name: 'Hafif Yağmur', url: '/sounds/rain.mp3' },
  { id: 'waves', name: 'Okyanus Dalgaları', url: '/sounds/waves.mp3' },
];

const DEFAULT_WIDGET_LAYOUT: WidgetPosition[] = [
  { i: 'greeting', x: 0, y: 0, w: 12, h: 2 },
  { i: 'stats', x: 0, y: 2, w: 12, h: 2 },
  { i: 'schedule', x: 0, y: 4, w: 8, h: 4 },
  { i: 'quickNote', x: 8, y: 4, w: 4, h: 4 },
  { i: 'recentFiles', x: 0, y: 8, w: 6, h: 4 },
  { i: 'goals', x: 6, y: 8, w: 6, h: 4 },
];

interface SettingsState {
  theme: ThemeType;
  dashboardOrder: string[];
  breakSounds: BreakSound[];
  selectedBreakSoundId: string;
  
  setTheme: (theme: ThemeType) => void;
  setDashboardOrder: (order: string[]) => void;
  addCustomBreakSound: (sound: BreakSound) => void;
  removeCustomBreakSound: (id: string) => void;
  setSelectedBreakSoundId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      dashboardOrder: ['tasks', 'quickNote', 'recentFiles', 'goals'],
      breakSounds: DEFAULT_BREAK_SOUNDS,
      selectedBreakSoundId: 'forest',
      
      setTheme: (theme) => set({ theme }),
      setDashboardOrder: (dashboardOrder) => set({ dashboardOrder }),
      
      addCustomBreakSound: (sound) => set((state) => ({ 
        breakSounds: [...state.breakSounds, { ...sound, isCustom: true }] 
      })),
      
      removeCustomBreakSound: (id) => set((state) => ({ 
        breakSounds: state.breakSounds.filter(s => s.id !== id || !s.isCustom),
        selectedBreakSoundId: state.selectedBreakSoundId === id ? 'forest' : state.selectedBreakSoundId
      })),
      
      setSelectedBreakSoundId: (selectedBreakSoundId) => set({ selectedBreakSoundId })
    }),
    {
      name: 'lifeos-settings-storage',
    }
  )
);
