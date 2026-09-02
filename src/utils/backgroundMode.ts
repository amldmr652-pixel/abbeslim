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
    
    // Foreground service başlat
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

    // WebView optimizasyonlarını kapat — arka planda audio çalmayı sağlar
    try {
      await BackgroundMode.disableWebViewOptimizations();
    } catch (e) {
      console.warn('[BackgroundMode] WebView optimizasyonları kapatılamadı:', e);
    }

    // Pil optimizasyonunu devre dışı bırakma isteği (opsiyonel)
    try {
      await BackgroundMode.requestDisableBatteryOptimizations();
    } catch (e) {
      console.warn('[BackgroundMode] Pil optimizasyonu devre dışı bırakılamadı:', e);
    }

    backgroundModeEnabled = true;
    console.log('[BackgroundMode] ✅ Etkinleştirildi');
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
    
    // WebView optimizasyonlarını geri aç
    try {
      await BackgroundMode.enableWebViewOptimizations();
    } catch {}
    
    await BackgroundMode.disable();
    backgroundModeEnabled = false;
    console.log('[BackgroundMode] ⏹ Devre dışı bırakıldı');
  } catch (e) {
    console.warn('[BackgroundMode] Devre dışı bırakılamadı:', e);
  }
}
