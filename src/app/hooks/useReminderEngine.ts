'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReminderStore } from '@/stores/useReminderStore';
import {
  sendNotification,
  requestNotificationPermission,
  cancelAllNativeNotifications,
  scheduleNativeNotification
} from '@/utils/notifications';

function getNumericId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

// Basit alarm sesi üret (Web Audio API)
async function playAlarmSound(soundType = 'beep') {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    const playBeep = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    if (soundType === 'chime') {
      playBeep(523.25, now, 0.4, 'triangle');
      playBeep(659.25, now + 0.2, 0.4, 'triangle');
      playBeep(783.99, now + 0.4, 0.6, 'triangle');
    } else if (soundType === 'gentle') {
      playBeep(440, now, 0.5, 'sine');
      playBeep(554.37, now + 0.3, 0.5, 'sine');
    } else {
      // 3 kısa bip sesi (beep / default)
      playBeep(880, now, 0.15);
      playBeep(880, now + 0.2, 0.15);
      playBeep(1100, now + 0.4, 0.3);
    }
  } catch (e) {
    console.warn('Alarm sesi çalınamadı:', e);
  }
}

export function useReminderEngine() {
  const { reminders, fetchReminders } = useReminderStore();
  const triggeredRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Mobil bildirimleri senkronize et
  const syncNativeReminders = useCallback(async (activeReminders: typeof reminders) => {
    try {
      await cancelAllNativeNotifications();
      const now = new Date();

      for (const reminder of activeReminders) {
        if (!reminder.is_active) continue;

        const timeParts = reminder.reminder_time.slice(0, 5).split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        const daysOfWeek = reminder.days_of_week && reminder.days_of_week.length > 0
          ? reminder.days_of_week
          : [0, 1, 2, 3, 4, 5, 6];

        for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
          const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hours, minutes, 0, 0);
          if (targetDate <= now) continue;

          if (daysOfWeek.includes(targetDate.getDay())) {
            const numericId = getNumericId(`${reminder.id}-${dayOffset}`);
            await scheduleNativeNotification(
              numericId,
              `🔔 ${reminder.title}`,
              reminder.description || 'Hatırlatıcı zamanı geldi!',
              targetDate
            );
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Native bildirim senkronizasyon hatası:', e);
    }
  }, []);

  // İlk yüklemede hatırlatıcıları çek ve bildirim izni iste
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchReminders();
      
      // Bildirim izni iste
      requestNotificationPermission().catch(() => {});
    }
  }, [fetchReminders]);

  // Reminders güncellendiğinde native bildirimleri yenile
  useEffect(() => {
    if (reminders.length > 0) {
      syncNativeReminders(reminders);
    }
  }, [reminders, syncNativeReminders]);

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
      playAlarmSound(reminder.sound || 'beep');

      // Bildirim gönder (Web/Mobil/Tauri)
      sendNotification(
        `🔔 ${reminder.title}`,
        reminder.description || 'Hatırlatıcı zamanı geldi!'
      );
    });
  }, [reminders]);

  // Her 30 saniyede kontrol et
  useEffect(() => {
    const interval = setInterval(checkReminders, 30000);
    checkReminders(); // İlk kontrol hemen
    return () => clearInterval(interval);
  }, [checkReminders]);
}
