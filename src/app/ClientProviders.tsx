'use client';

import { MusicProvider } from './context/MusicContext';
import HiddenYouTubePlayer from './HiddenYouTubePlayer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MusicProvider>
      {children}
      {/* Arka planda YouTube sesini çalan gizli bileşen */}
      <HiddenYouTubePlayer />
    </MusicProvider>
  );
}
