import { create } from 'zustand';

export type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  currentMode: Mode;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  endTime: number | null;
  pomodoroCount: number;
  isFinished: boolean;
  isShaking: boolean;
  
  start: (timeToRun: number) => void;
  pause: () => void;
  reset: (timeToReset: number) => void;
  tick: () => void;
  setMode: (mode: Mode, time: number) => void;
  setFinished: (finished: boolean) => void;
  setShaking: (shaking: boolean) => void;
  incrementPomodoroCount: () => void;
  setTimeLeft: (time: number) => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  currentMode: 'pomodoro',
  timeLeft: 25 * 60,
  isRunning: false,
  isPaused: false,
  endTime: null,
  pomodoroCount: 0,
  isFinished: false,
  isShaking: false,

  start: (timeToRun) => {
    set({
      isRunning: true,
      isPaused: false,
      endTime: Date.now() + timeToRun * 1000,
      timeLeft: timeToRun
    });
  },

  pause: () => {
    set({
      isRunning: false,
      isPaused: true,
      endTime: null
    });
  },

  reset: (timeToReset) => {
    set({
      isRunning: false,
      isPaused: false,
      endTime: null,
      isFinished: false,
      timeLeft: timeToReset
    });
  },

  tick: () => {
    const { endTime, isRunning } = get();
    if (!isRunning || !endTime) return;
    const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    set({ timeLeft: remaining });
  },

  setMode: (currentMode, time) => {
    set({
      currentMode,
      timeLeft: time,
      isRunning: false,
      isPaused: false,
      endTime: null,
      isFinished: false
    });
  },

  setFinished: (isFinished) => set({ isFinished }),
  setShaking: (isShaking) => set({ isShaking }),
  incrementPomodoroCount: () => set((state) => ({ pomodoroCount: state.pomodoroCount + 1 })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
}));
