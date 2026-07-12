import { useState, useEffect, useRef, useCallback } from 'react';
import { useMusicContext } from '../context/MusicContext';
import { createClient } from '@/utils/supabase/client';

export type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

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
  const [settings, setSettings] = useState(defaultSettings);
  const [currentMode, setCurrentMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Music Context
  const {
    isMusicSynced,
    selectedChannelId,
    setIsMusicPlaying,
  } = useMusicContext();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  const handleFinishRef = useRef<(() => void) | null>(null);
  const startTimerRef = useRef<((overrideTime?: number) => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro-settings-v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
          setTimeLeft(parsed.pomodoro * 60);
        } catch (e) {
          console.warn("Ayarlar okunamadı:", e);
        }
      }
    }
  }, []);

  const saveSettings = (newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoro-settings-v2', JSON.stringify(newSettings));
    if (!isRunning) {
      setTimeLeft(newSettings[currentMode] * 60);
    }
  };

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { 
      clearInterval(intervalRef.current); 
      intervalRef.current = null; 
    }
    endTimeRef.current = null;
  }, []);

  useEffect(() => {
    handleFinishRef.current = () => {
      stopInterval(); 
      setIsRunning(false); 
      setIsFinished(true); 
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 1000);
      
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Süre Doldu! ⏱️', {
          body: currentMode === 'pomodoro' ? 'Harika iş çıkardın! Şimdi mola zamanı.' : 'Mola bitti, odaklanma zamanı!',
        });
      }
      
      const isPomodoro = currentMode === 'pomodoro';
      let nextMode: Mode;
      let newCount = pomodoroCount;

      if (isPomodoro) {
        nextMode = pomodoroCount % (settings.longBreakInterval + 1) === 0 ? 'longBreak' : 'shortBreak';
        newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
      } else {
        nextMode = 'pomodoro';
      }

      const nextTime = settings[nextMode] * 60;
      const autoStart = isPomodoro ? settings.autoStartBreaks : settings.autoStartPomodoros;

      setTimeout(() => { 
        setCurrentMode(nextMode); 
        setIsFinished(false); 
        setTimeLeft(nextTime); 
        
        if (autoStart) {
          startTimerRef.current?.(nextTime);
        }
      }, 3000);

      // Log session to Supabase in background
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('pomodoro_sessions').insert([{
            user_id: user.id,
            duration_minutes: settings[currentMode],
            mode: currentMode
          }]).then(({ error }) => {
            if (error) console.error("Pomodoro log error:", error);
          });
        }
      });
    };

    startTimerRef.current = (overrideTime?: number) => {
      if (intervalRef.current) return; // Zaten çalışıyorsa engelle
      if (typeof window !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      const timeToRun = overrideTime !== undefined ? overrideTime : timeLeft;
      if (timeToRun <= 0) return;

      setIsRunning(true);
      
      // Arka plan senkronizasyonu için hedef zamanı kaydet (Background Sync)
      endTimeRef.current = Date.now() + timeToRun * 1000;

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        
        if (remaining <= 0) {
          setTimeLeft(0);
          handleFinishRef.current?.();
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // Daha hızlı tick, yüksek isabet oranı
    };
  }, [currentMode, pomodoroCount, settings, stopInterval, timeLeft]);

  const startTimer  = () => startTimerRef.current?.();
  const pauseTimer  = useCallback(() => { stopInterval(); setIsRunning(false); }, [stopInterval]);
  const resetTimer  = useCallback((mode?: Mode) => { 
    stopInterval(); 
    setIsRunning(false); 
    setIsFinished(false); 
    const targetMode = mode ?? currentMode;
    setTimeLeft(settings[targetMode] * 60); 
  }, [stopInterval, currentMode, settings]);
  
  const switchMode  = useCallback((mode: Mode) => { 
    setCurrentMode(mode); 
    resetTimer(mode); 
  }, [resetTimer]);
  
  const skipSession = useCallback(() => {
    stopInterval(); setIsRunning(false);
    if (currentMode === 'pomodoro') {
      switchMode(pomodoroCount % (settings.longBreakInterval + 1) === 0 ? 'longBreak' : 'shortBreak');
      setPomodoroCount(prev => prev + 1);
    } else {
      switchMode('pomodoro');
    }
  }, [stopInterval, currentMode, pomodoroCount, settings.longBreakInterval, switchMode]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  // Pomodoro ile müzik senkronizasyonu
  useEffect(() => {
    if (!isMusicSynced || !selectedChannelId) return;
    setIsMusicPlaying(isRunning);
  }, [isRunning, isMusicSynced, selectedChannelId, setIsMusicPlaying]);

  return {
    settings,
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
