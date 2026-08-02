'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReminderStore } from '@/stores/useReminderStore';

// Basit alarm sesi üret (Web Audio API)
function playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    // 3 kısa bip sesi
    playBeep(880, now, 0.15);
    playBeep(880, now + 0.2, 0.15);
    playBeep(1100, now + 0.4, 0.3);
  } catch (e) {
    console.warn('Alarm sesi çalınamadı:', e);
  }
}

export function useReminderEngine() {
  const { reminders, fetchReminders } = useReminderStore();
  const triggeredRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // İlk yüklemede hatırlatıcıları çek ve bildirim izni iste
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchReminders();
      
      // Bildirim izni iste
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    }
  }, [fetchReminders]);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    const currentDay = now.getDay(); // 0=Pazar

    reminders.forEach(reminder => {
      if (!reminder.is_active) return;

      // Gün kontrolü
      if (reminder.days_of_week && !reminder.days_of_week.includes(currentDay)) return;

      // Saat eşleşmesi (HH:MM)
      const reminderTime = reminder.reminder_time.slice(0, 5); // "07:00:00" → "07:00"
      if (reminderTime !== currentTimeStr) return;

      // Bugün zaten tetiklendi mi?
      const todayKey = `${reminder.id}-${now.toDateString()}`;
      if (triggeredRef.current.has(todayKey)) return;

      // Tetikle!
      triggeredRef.current.add(todayKey);

      // Alarm sesi çal
      playAlarmSound();

      // Tarayıcı bildirimi
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 ${reminder.title}`, {
          body: reminder.description || 'Hatırlatıcı zamanı geldi!',
          icon: '/favicon.ico',
          tag: todayKey, // Aynı bildirimi tekrar gösterme
        });
      }
    });
  }, [reminders]);

  // Her 30 saniyede kontrol et
  useEffect(() => {
    const interval = setInterval(checkReminders, 30000);
    checkReminders(); // İlk kontrol hemen
    return () => clearInterval(interval);
  }, [checkReminders]);
}
