/**
 * Capacitor Background Mode yönetimi
 * Müzik arka planda çalarken uygulamanın uyutulmasını engeller.
 */
import { Capacitor } from '@capacitor/core';

let backgroundModeEnabled = false;

/**
 * Arka plan modunu etkinleştir — müzik çalmaya başladığında çağrılır
 */
export async function enableBackgroundMode() {
  if (!Capacitor.isNativePlatform() || backgroundModeEnabled) return;

  try {
    const { BackgroundMode } = await import('@anuradev/capacitor-background-mode');
    await BackgroundMode.enable({
      title: 'abbeslim.',
      text: 'Müzik çalınıyor...',
      icon: 'ic_launcher',
      channelName: 'Müzik Çalma',
      channelDescription: 'Arka planda müzik çalma bildirimi',
      silent: false,
      hidden: false,
      resume: true,
      disableWebViewOptimization: true,
    });
    backgroundModeEnabled = true;
  } catch (e) {
    console.warn('[BackgroundMode] Etkinleştirilemedi:', e);
  }
}

/**
 * Arka plan modunu devre dışı bırak — müzik durduğunda çağrılır
 */
export async function disableBackgroundMode() {
  if (!Capacitor.isNativePlatform() || !backgroundModeEnabled) return;

  try {
    const { BackgroundMode } = await import('@anuradev/capacitor-background-mode');
    await BackgroundMode.disable();
    backgroundModeEnabled = false;
  } catch (e) {
    console.warn('[BackgroundMode] Devre dışı bırakılamadı:', e);
  }
}
