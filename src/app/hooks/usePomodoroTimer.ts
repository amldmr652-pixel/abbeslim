import { useEffect, useRef, useCallback } from 'react';
import { useMusicContext } from '../context/MusicContext';
import { createClient } from '@/utils/supabase/client';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePomodoroStore, Mode as PomodoroMode } from '@/stores/usePomodoroStore';
import { sendNotification, requestNotificationPermission } from '@/utils/notifications';

export type Mode = PomodoroMode;

export const defaultSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 3,
  autoStartBreaks: true,
  autoStartPomodoros: false,
};

export const MODE_LABELS: Record<Mode, string> = {
  pomodoro: 'Odaklanma Süresi',
  shortBreak: 'Kısa Mola',
  longBreak: 'Uzun Mola',
};

export function usePomodoroTimer() {
  const {
    currentMode, timeLeft, isRunning, endTime, pomodoroCount, isFinished, isShaking,
    start, pause, reset, tick, setMode, setFinished, setShaking, incrementPomodoroCount, setTimeLeft
  } = usePomodoroStore();

  const settings = useSettingsStore();
  const breakSounds = settings.breakSounds || [];
  const selectedBreakSoundId = settings.selectedBreakSoundId || 'forest';

  // Music Context
  const {
    isMusicSynced,
    selectedChannelId,
    setIsMusicPlaying,
  } = useMusicContext();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync settings back to timeLeft when timer is idle and not finished
  const currentWorkTime = settings.pomodoroWork || 25;
  const currentShortTime = settings.pomodoroShortBreak || 5;
  const currentLongTime = settings.pomodoroLongBreak || 15;

  useEffect(() => {
    if (!isRunning && !isFinished) {
      const duration = currentMode === 'pomodoro'
        ? currentWorkTime * 60
        : currentMode === 'shortBreak'
          ? currentShortTime * 60
          : currentLongTime * 60;
      setTimeLeft(duration);
    }
  }, [currentMode, currentWorkTime, currentShortTime, currentLongTime, isRunning, isFinished, setTimeLeft]);

  // Tick timer & mobile visibility sync
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, tick]);

  const handleFinish = useCallback(() => {
    pause();
    setFinished(true);
    setShaking(true);
    setTimeout(() => setShaking(false), 1000);

    sendNotification(
      'Süre Doldu! 🍅',
      currentMode === 'pomodoro' ? 'Harika iş çıkardın! Şimdi mola zamanı.' : 'Mola bitti, odaklanma zamanı!'
    );

    const isPomodoro = currentMode === 'pomodoro';
    let nextMode: Mode;

    if (isPomodoro) {
      const nextCount = pomodoroCount + 1;
      const interval = settings.pomodoroLongBreakInterval || 4;
      nextMode = (nextCount % interval === 0) ? 'longBreak' : 'shortBreak';
      incrementPomodoroCount();
      // Molaya geçilince otomatik müzik çal
      try {
        setIsMusicPlaying(true);
      } catch (e) {
        // MusicContext fallback
      }
    } else {
      nextMode = 'pomodoro';
    }

    // Get time for next mode
    const nextTime = nextMode === 'pomodoro' 
      ? (settings.pomodoroWork || 25) * 60 
      : nextMode === 'shortBreak' 
        ? (settings.pomodoroShortBreak || 5) * 60 
        : (settings.pomodoroLongBreak || 15) * 60;

    const autoStart = isPomodoro ? settings.pomodoroAutoStartBreaks : settings.pomodoroAutoStartPomodoros;

    setTimeout(() => {
      setMode(nextMode, nextTime);
      setFinished(false);
      if (autoStart) {
        start(nextTime);
      }
    }, 3000);

    // Log seansı
    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      if (user) {
        const duration = currentMode === 'pomodoro' 
          ? settings.pomodoroWork 
          : currentMode === 'shortBreak' 
            ? settings.pomodoroShortBreak 
            : settings.pomodoroLongBreak;

        supabase.from('pomodoro_sessions').insert([{
          user_id: user.id,
          duration_minutes: duration,
          mode: currentMode
        }]).then((res: any) => {
          if (res?.error) console.error("Pomodoro log error:", res.error);
        });
      }
    });
  }, [currentMode, pomodoroCount, settings, pause, setFinished, setShaking, incrementPomodoroCount, setMode, start, setIsMusicPlaying]);

  // Handle completion check
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleFinish();
    }
  }, [timeLeft, isRunning, handleFinish]);

  const startTimer = () => {
    requestNotificationPermission().catch(() => {});
    start(timeLeft);
  };

  const pauseTimer = () => {
    pause();
  };

  const resetTimer = useCallback((mode?: Mode) => {
    const targetMode = mode ?? currentMode;
    const time = targetMode === 'pomodoro' 
      ? (settings.pomodoroWork || 25) * 60 
      : targetMode === 'shortBreak' 
        ? (settings.pomodoroShortBreak || 5) * 60 
        : (settings.pomodoroLongBreak || 15) * 60;
    reset(time);
  }, [currentMode, settings, reset]);

  const switchMode = useCallback((mode: Mode) => {
    const time = mode === 'pomodoro' 
      ? (settings.pomodoroWork || 25) * 60 
      : mode === 'shortBreak' 
        ? (settings.pomodoroShortBreak || 5) * 60 
        : mode === 'longBreak' 
          ? (settings.pomodoroLongBreak || 15) * 60
          : 25 * 60;
    setMode(mode, time);
  }, [settings, setMode]);

  const skipSession = useCallback(() => {
    pause();
    if (currentMode === 'pomodoro') {
      const nextCount = pomodoroCount + 1;
      const interval = settings.pomodoroLongBreakInterval || 4;
      const nextMode = (nextCount % interval === 0) ? 'longBreak' : 'shortBreak';
      incrementPomodoroCount();
      switchMode(nextMode);
    } else {
      switchMode('pomodoro');
    }
  }, [currentMode, pomodoroCount, settings.pomodoroLongBreakInterval, incrementPomodoroCount, switchMode, pause]);

  // Pomodoro ile müzik senkronizasyonu
  useEffect(() => {
    if (!isMusicSynced || !selectedChannelId) return;
    if (currentMode === 'pomodoro') {
      setIsMusicPlaying(isRunning);
    } else {
      setIsMusicPlaying(false);
    }
  }, [isRunning, isMusicSynced, selectedChannelId, setIsMusicPlaying, currentMode]);

  // Mola Sesleri
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    if (isRunning && (currentMode === 'shortBreak' || currentMode === 'longBreak')) {
      const safeBreakSounds = breakSounds || [];
      const sound = safeBreakSounds.find(s => s?.id === selectedBreakSoundId);
      if (sound && audioRef.current) {
        if (audioRef.current.src !== sound.url || audioRef.current.paused) {
          audioRef.current.src = sound.url;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.warn("Mola sesi otomatik başlatılamadı (tarayıcı kısıtlaması):", e);
            });
          }
        }
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isRunning, currentMode, breakSounds, selectedBreakSoundId]);

  const saveSettings = (newSettings: {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  }) => {
    settings.updateSettings({
      pomodoroWork: newSettings.pomodoro,
      pomodoroShortBreak: newSettings.shortBreak,
      pomodoroLongBreak: newSettings.longBreak,
      pomodoroLongBreakInterval: newSettings.longBreakInterval,
      pomodoroAutoStartBreaks: newSettings.autoStartBreaks,
      pomodoroAutoStartPomodoros: newSettings.autoStartPomodoros
    });
  };

  return {
    settings: {
      pomodoro: settings.pomodoroWork,
      shortBreak: settings.pomodoroShortBreak,
      longBreak: settings.pomodoroLongBreak,
      longBreakInterval: settings.pomodoroLongBreakInterval,
      autoStartBreaks: settings.pomodoroAutoStartBreaks,
      autoStartPomodoros: settings.pomodoroAutoStartPomodoros
    },
    saveSettings,
    currentMode,
    timeLeft,
    isRunning,
    pomodoroCount,
    isFinished,
    isShaking,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    skipSession
  };
}
