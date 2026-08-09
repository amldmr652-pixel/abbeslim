/**
 * Çapraz platform bildirim yardımcısı.
 * - Mobil (Capacitor): @capacitor/local-notifications kullanır
 * - Web / Masaüstü (Tauri WebView): Tarayıcı Notification API kullanır
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Bildirim izni iste (platform bağımsız)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 1. Mobil Native Platform (Android / iOS)
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      try {
        const perms = await LocalNotifications.checkPermissions();
        if (perms.display === 'granted') {
          return true;
        }
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      } catch (err) {
        console.warn('Capacitor LocalNotifications permission error:', err);
      }
    }

    // 2. Web / Tauri / Chrome WebView Fallback
    if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        return true;
      }
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
  } catch (e) {
    console.error('Error requesting notification permission:', e);
  }

  return false;
}

/**
 * Bildirim gönder (platform bağımsız)
 */
let notificationIdCounter = 1;

export async function sendNotification(title: string, body: string): Promise<void> {
  try {
    // 1. Mobil Native Platform (Android / iOS)
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      try {
        const perms = await LocalNotifications.checkPermissions();
        if (perms.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') return;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationIdCounter++,
              title,
              body,
              schedule: { at: new Date(Date.now() + 100) }, // Hemen göster
            },
          ],
        });
        return;
      } catch (err) {
        console.warn('Capacitor LocalNotifications schedule error:', err);
      }
    }

    // 2. Web / Tauri WebView Fallback
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (err) {
        console.warn('Browser Notification send error:', err);
      }
    }
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}
