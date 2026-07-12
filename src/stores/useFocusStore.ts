import { create } from 'zustand';

interface FocusState {
  isFocusModeActive: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (active: boolean) => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  isFocusModeActive: false,
  toggleFocusMode: () => set((state) => ({ isFocusModeActive: !state.isFocusModeActive })),
  setFocusMode: (active) => set({ isFocusModeActive: active }),
}));
