'use client';

import PomodoroWidget from './components/PomodoroWidget';
import Sidebar from './components/layout/Sidebar';
import { useMusicContext } from './context/MusicContext';

/**
 * Layout içinde client context'e erişip Sidebar + PomodoroWidget'ı render eden sarmalayıcı.
 * layout.tsx server component olduğundan context hook'u doğrudan kullanamaz.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { setIsMusicPanelOpen } = useMusicContext();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <PomodoroWidget onOpenMusicPanel={() => setIsMusicPanelOpen(true)} />
    </div>
  );
}
