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
  { id: 'forest', name: 'Orman Kuşları', url: 'https://cdn.freesound.org/previews/531/531015_2394828-lq.mp3' },
  { id: 'rain', name: 'Hafif Yağmur', url: 'https://cdn.freesound.org/previews/346/346642_4939433-lq.mp3' },
  { id: 'waves', name: 'Okyanus Dalgaları', url: 'https://cdn.freesound.org/previews/467/467539_5765618-lq.mp3' },
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

  // ── YENİ: Müzik Ayarları ──
  musicDefaultVolume: number;        // 0-1, default 0.7
  musicAutoplayOnLogin: boolean;     // default false
  musicShowMiniPlayer: boolean;      // default true
  musicSleepTimer: number | null;    // dakika, null=kapalı

  // ── YENİ: Pomodoro Ayarları ──
  pomodoroWork: number;              // default 25
  pomodoroShortBreak: number;        // default 5
  pomodoroLongBreak: number;         // default 15
  pomodoroLongBreakInterval: number; // default 3
  pomodoroAutoStartBreaks: boolean;  // default true
  pomodoroAutoStartPomodoros: boolean; // default false

  // ── YENİ: Takvim Ayarları ──
  calendarDefaultView: 'month' | 'week'; // default 'month'
  calendarFirstDayOfWeek: 0 | 1;    // default 1
  calendarShowTasks: boolean;        // default true
  calendarEventColor: string;        // default '#22c55e'

  // ── YENİ: Finans Ayarları ──
  financeCurrency: string;           // default '₺'
  financeCategories: string[];       // default ['Yemek','Ulaşım','Eğlence','Eğitim','Sağlık','Kira','Maaş','Diğer']

  // ── YENİ: Not Ayarları ──
  notesAutoSave: boolean;            // default true
  notesAutoSaveInterval: number;     // saniye, default 30
  notesFontSize: 'small' | 'medium' | 'large'; // default 'medium'

  // ── YENİ: Görev Ayarları ──
  tasksDefaultPriority: 'low' | 'medium' | 'high'; // default 'medium'
  tasksShowCompleted: boolean;       // default true
  tasksSortBy: 'date' | 'priority' | 'name'; // default 'date'

  // ── YENİ: Hedef Ayarları ──
  goalsShowCompleted: boolean;       // default false
  habitsShowStreak: boolean;         // default true

  // ── YENİ: Tracker Ayarları ──
  trackerDefaultType: 'movie' | 'show' | 'book'; // default 'movie'

  // ── YENİ: Oyun Ayarları ──
  gamesDailyLimit: number;           // dakika, default 15

  // ── YENİ: Harita Ayarları ──
  mapDefaultCenter: [number, number]; // default [39.0, 35.0]
  mapDefaultZoom: number;            // default 6
  mapTileStyle: 'dark' | 'light' | 'satellite'; // default 'dark'

  // ── YENİ: AI Chat Ayarları ──
  chatDefaultMode: 'sources' | 'hybrid' | 'independent'; // default 'hybrid'
  chatSaveHistory: boolean;          // default true

  // ── YENİ: Arama Ayarları ──
  searchDefaultMode: 'hybrid' | 'phrase' | 'word' | 'semantic'; // default 'hybrid'
  
  setTheme: (theme: ThemeType) => void;
  setDashboardOrder: (order: string[]) => void;
  addCustomBreakSound: (sound: BreakSound) => void;
  removeCustomBreakSound: (id: string) => void;
  setSelectedBreakSoundId: (id: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setShortcut: (action: string, shortcut: ShortcutConfig | null) => void;
  resetShortcuts: () => void;
  updateSettings: (partial: Partial<SettingsState>) => void;
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

      // Default values for new states
      musicDefaultVolume: 0.7,
      musicAutoplayOnLogin: false,
      musicShowMiniPlayer: true,
      musicSleepTimer: null,

      pomodoroWork: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      pomodoroLongBreakInterval: 3,
      pomodoroAutoStartBreaks: true,
      pomodoroAutoStartPomodoros: false,

      calendarDefaultView: 'month',
      calendarFirstDayOfWeek: 1,
      calendarShowTasks: true,
      calendarEventColor: '#22c55e',

      financeCurrency: '₺',
      financeCategories: ['Yemek', 'Ulaşım', 'Eğlence', 'Eğitim', 'Sağlık', 'Kira', 'Maaş', 'Diğer'],

      notesAutoSave: true,
      notesAutoSaveInterval: 30,
      notesFontSize: 'medium',

      tasksDefaultPriority: 'medium',
      tasksShowCompleted: true,
      tasksSortBy: 'date',

      goalsShowCompleted: false,
      habitsShowStreak: true,

      trackerDefaultType: 'movie',

      gamesDailyLimit: 15,

      mapDefaultCenter: [39.0, 35.0],
      mapDefaultZoom: 6,
      mapTileStyle: 'dark',

      chatDefaultMode: 'hybrid',
      chatSaveHistory: true,

      searchDefaultMode: 'hybrid',
      
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
      
      resetShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS }),
      updateSettings: (partial) => set((state) => ({ ...state, ...partial }))
    }),
    {
      name: 'lifeos-settings-storage-v2', // bumped storage key version to prevent migration issues
    }
  )
);
