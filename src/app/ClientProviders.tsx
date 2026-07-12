'use client';

import { useEffect } from 'react';
import { MusicProvider } from './context/MusicContext';
import HiddenYouTubePlayer from './HiddenYouTubePlayer';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-amoled');
    // Add the active theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <MusicProvider>
      {children}
      {/* Arka planda YouTube sesini çalan gizli bileşen */}
      <HiddenYouTubePlayer />
    </MusicProvider>
  );
}
