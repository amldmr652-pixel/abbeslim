'use client';

import { Capacitor } from '@capacitor/core';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): string {
  return Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
}

export async function initCapacitor() {
  if (!isNativePlatform()) return;

  // Body'ye capacitor class'ı ekle
  document.body.classList.add('capacitor');

  // Status Bar ayarları
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch (e) {
    console.warn('StatusBar plugin not available:', e);
  }

  // Keyboard ayarları
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  } catch (e) {
    console.warn('Keyboard plugin not available:', e);
  }

  // Geri tuşu davranışı (Android)
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    console.warn('App plugin not available:', e);
  }
}
