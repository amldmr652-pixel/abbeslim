import { create } from 'zustand';

interface AppState {
  // Sidebar durumu
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Aktif modül
  activeModule: string;

  // Aksiyonlar
  toggleSidebarCollapse: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setActiveModule: (module: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeModule: 'dashboard',

  toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setActiveModule: (module) => set({ activeModule: module }),
}));
