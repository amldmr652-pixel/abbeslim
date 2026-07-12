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

export interface ShortcutConfig {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export const DEFAULT_SHORTCUTS: Record<string, ShortcutConfig> = {
  goToDashboard: { key: '1', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToSearch: { key: '2', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToLibrary: { key: '3', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToCalendar: { key: '4', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToNotes: { key: '5', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToTasks: { key: '6', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToGoals: { key: '7', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToFinance: { key: '8', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToGames: { key: '9', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToTracker: { key: '0', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  goToMap: { key: 'M', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  toggleMusic: { key: 'K', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  togglePomodoro: { key: 'P', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  toggleAIChat: { key: 'C', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  toggleFocusMode: { key: 'F', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
  toggleSidebar: { key: 'B', ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
};

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
  sidebarCollapsed: boolean;
  shortcuts: Record<string, ShortcutConfig | null>;
  
  setTheme: (theme: ThemeType) => void;
  setDashboardOrder: (order: string[]) => void;
  addCustomBreakSound: (sound: BreakSound) => void;
  removeCustomBreakSound: (id: string) => void;
  setSelectedBreakSoundId: (id: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setShortcut: (action: string, shortcut: ShortcutConfig | null) => void;
  resetShortcuts: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      dashboardOrder: ['tasks', 'quickNote', 'recentFiles', 'goals'],
      breakSounds: DEFAULT_BREAK_SOUNDS,
      selectedBreakSoundId: 'forest',
      sidebarCollapsed: false,
      shortcuts: DEFAULT_SHORTCUTS,
      
      setTheme: (theme) => set({ theme }),
      setDashboardOrder: (dashboardOrder) => set({ dashboardOrder }),
      
      addCustomBreakSound: (sound) => set((state) => ({ 
        breakSounds: [...state.breakSounds, { ...sound, isCustom: true }] 
      })),
      
      removeCustomBreakSound: (id) => set((state) => ({ 
        breakSounds: state.breakSounds.filter(s => s.id !== id || !s.isCustom),
        selectedBreakSoundId: state.selectedBreakSoundId === id ? 'forest' : state.selectedBreakSoundId
      })),
      
      setSelectedBreakSoundId: (selectedBreakSoundId) => set({ selectedBreakSoundId }),
      
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      
      setShortcut: (action, shortcut) => set((state) => ({
        shortcuts: {
          ...state.shortcuts,
          [action]: shortcut
        }
      })),
      
      resetShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS })
    }),
    {
      name: 'lifeos-settings-storage',
    }
  )
);
