/**
 * Çapraz platform bildirim yardımcısı.
 * - Mobil (Capacitor): @capacitor/local-notifications kullanır
 * - Web / Masaüstü (Tauri WebView): Tarayıcı Notification API kullanır
 */

import { Capacitor } from '@capacitor/core';

let LocalNotifications: typeof import('@capacitor/local-notifications').LocalNotifications | null = null;

// Capacitor eklentisini lazy-load et
async function getLocalNotifications() {
  if (LocalNotifications) return LocalNotifications;
  try {
    const mod = await import('@capacitor/local-notifications');
    LocalNotifications = mod.LocalNotifications;
    return LocalNotifications;
  } catch {
    return null;
  }
}

/**
 * Bildirim izni iste (platform bağımsız)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Capacitor native platform (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    const ln = await getLocalNotifications();
    if (!ln) return false;
    const result = await ln.requestPermissions();
    return result.display === 'granted';
  }

  // Web / Tauri WebView
  if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
  }

  return false;
}

/**
 * Bildirim gönder (platform bağımsız)
 */
let notificationIdCounter = 1;

export async function sendNotification(title: string, body: string): Promise<void> {
  // Capacitor native platform (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    const ln = await getLocalNotifications();
    if (!ln) return;

    // İzin kontrolü
    const perms = await ln.checkPermissions();
    if (perms.display !== 'granted') {
      const req = await ln.requestPermissions();
      if (req.display !== 'granted') return;
    }

    await ln.schedule({
      notifications: [
        {
          id: notificationIdCounter++,
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) }, // Hemen gönder
          sound: undefined,
          smallIcon: 'ic_notification',
          largeIcon: 'ic_notification',
        },
      ],
    });
    return;
  }

  // Web / Tauri WebView
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(title, { body });
    } catch (err) {
      console.warn('Notification send error:', err);
    }
  }
}
