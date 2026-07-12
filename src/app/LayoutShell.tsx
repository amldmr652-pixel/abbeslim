'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Timer, MessageCircle } from 'lucide-react';
import PomodoroWidget from './components/PomodoroWidget';
import AIChatWidget from './components/AIChatWidget';
import Sidebar from './components/layout/Sidebar';
import { useMusicContext } from './context/MusicContext';
import { createClient } from '@/utils/supabase/client';
import MusicPanelModal from './components/search/MusicPanelModal';

// Auth sayfaları — bu route'larda widget'lar gizlenir
const AUTH_ROUTES = ['/login', '/register', '/pending-approval'];

/**
 * Layout içinde client context'e erişip Sidebar + Widget'ları render eden sarmalayıcı.
 * Auth sayfalarında widget'lar gizlenir.
 * Widget'lar sağ üst köşede dropdown panel olarak açılır.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { setIsMusicPanelOpen } = useMusicContext();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'pomodoro' | 'ai'>('none');

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, [pathname]);

  // Panel dışına tıklanırsa kapat
  const handleBackdropClick = () => {
    setActivePanel('none');
  };

  const togglePanel = (panel: 'pomodoro' | 'ai') => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  // Auth sayfalarında sadece children render et
  if (isAuthRoute) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Sağ Üst Köşe Widget Butonları */}
      {isAuthenticated && (
        <>
          {/* Backdrop — panel açıkken arka planı karartır */}
          {activePanel !== 'none' && (
            <div 
              className="fixed inset-0 z-[9990] bg-black/30"
              onClick={handleBackdropClick}
            />
          )}

          {/* Sağ üst buton grubu */}
          <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
            {/* Pomodoro Toggle Butonu */}
            <button
              onClick={() => togglePanel('pomodoro')}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                activePanel === 'pomodoro'
                  ? 'bg-green-500 text-white shadow-green-500/40'
                  : 'glass text-gray-400 hover:text-green-400'
              }`}
              title="Pomodoro"
            >
              <Timer size={20} />
            </button>

            {/* AI Chat Toggle Butonu */}
            <button
              onClick={() => togglePanel('ai')}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                activePanel === 'ai'
                  ? 'bg-green-500 text-white shadow-green-500/40'
                  : 'glass text-gray-400 hover:text-green-400'
              }`}
              title="AI Asistan"
            >
              <MessageCircle size={20} />
            </button>
          </div>

          {/* Pomodoro Dropdown Panel */}
          <div
            className={`fixed top-[60px] right-4 z-[9998] transition-all duration-300 ease-out origin-top-right ${
              activePanel === 'pomodoro'
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <PomodoroWidget onOpenMusicPanel={() => setIsMusicPanelOpen(true)} />
          </div>

          {/* AI Chat Dropdown Panel */}
          <div
            className={`fixed top-[60px] right-4 z-[9998] transition-all duration-300 ease-out origin-top-right ${
              activePanel === 'ai'
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <AIChatWidget isDropdown={true} />
          </div>
        </>
      )}

      {/* Odak Müzik Modalı (Global) */}
      <MusicPanelModal />
    </div>
  );
}
