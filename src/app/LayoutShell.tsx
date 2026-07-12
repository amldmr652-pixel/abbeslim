'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Timer, MessageCircle, Maximize, X } from 'lucide-react';
import PomodoroWidget from './components/PomodoroWidget';
import AIChatWidget from './components/AIChatWidget';
import Sidebar from './components/layout/Sidebar';
import { useMusicContext } from './context/MusicContext';
import { createClient } from '@/utils/supabase/client';
import { useSettingsStore } from '@/stores/useSettingsStore';
import MusicPanelModal from './components/search/MusicPanelModal';

// Auth sayfaları — bu route'larda widget'lar gizlenir
const AUTH_ROUTES = ['/login', '/register', '/pending-approval'];

/**
 * Layout içinde client context'e erişip Sidebar + Widget'ları render eden sarmalayıcı.
 * Auth sayfalarında widget'lar gizlenir.
 * Widget'lar sağ üst köşede dropdown panel olarak açılır.
 */
import FocusModeOverlay from './components/FocusModeOverlay';
import { useFocusStore } from '@/stores/useFocusStore';
// Maximize and X imported above from lucide-react

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { setIsMusicPanelOpen, isMusicPanelOpen } = useMusicContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'pomodoro' | 'ai'>('none');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setFocusMode, toggleFocusMode } = useFocusStore();
  const { theme, shortcuts, sidebarCollapsed, setSidebarCollapsed } = useSettingsStore();

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, [pathname]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea/contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const isInput = tagName === 'input' || 
                        tagName === 'textarea' || 
                        activeEl.hasAttribute('contenteditable') || 
                        (activeEl as HTMLElement).isContentEditable;
        if (isInput) return;
      }

      if (!shortcuts) return;

      // Check all actions in shortcuts configuration
      for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (!shortcut) continue;

        // Compare key and modifiers
        const eventKey = e.key.toUpperCase();
        const targetKey = shortcut.key.toUpperCase();

        const match = eventKey === targetKey &&
                      shortcut.ctrlKey === e.ctrlKey &&
                      shortcut.altKey === e.altKey &&
                      shortcut.shiftKey === e.shiftKey &&
                      shortcut.metaKey === e.metaKey;

        if (match) {
          e.preventDefault();
          e.stopPropagation();

          // Execute action
          switch (action) {
            case 'goToDashboard':
              router.push('/');
              break;
            case 'goToSearch':
              router.push('/search');
              break;
            case 'goToLibrary':
              router.push('/library');
              break;
            case 'goToCalendar':
              router.push('/calendar');
              break;
            case 'goToNotes':
              router.push('/notes');
              break;
            case 'goToTasks':
              router.push('/tasks');
              break;
            case 'goToGoals':
              router.push('/goals');
              break;
            case 'goToFinance':
              router.push('/finance');
              break;
            case 'goToGames':
              router.push('/games');
              break;
            case 'goToTracker':
              router.push('/tracker');
              break;
            case 'goToMap':
              router.push('/map');
              break;
            case 'toggleMusic':
              setIsMusicPanelOpen(!isMusicPanelOpen);
              break;
            case 'togglePomodoro':
              togglePanel('pomodoro');
              break;
            case 'toggleAIChat':
              togglePanel('ai');
              break;
            case 'toggleFocusMode':
              toggleFocusMode();
              break;
            case 'toggleSidebar':
              setSidebarCollapsed(!sidebarCollapsed);
              break;
            default:
              break;
          }
          break; // Action found and executed, stop scanning
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isAuthenticated, isMusicPanelOpen, sidebarCollapsed, toggleFocusMode, setSidebarCollapsed, setIsMusicPanelOpen, router]);

  // Tema sınıfını body'ye uygula
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-amoled');
    if (theme !== 'dark') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Panel dışına tıklanırsa kapat
  const handleBackdropClick = () => {
    setActivePanel('none');
    setIsMenuOpen(false);
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
    <div className="flex h-screen overflow-hidden relative">
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

          {/* Sağ kenar yüzen radyal buton grubu */}
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[9999] w-8 h-12 flex items-center justify-start">
            {/* Gelişmiş Odak Modu Butonu (Sol Üst - 135 derece) */}
            <button
              onClick={() => {
                setFocusMode(true);
                setIsMenuOpen(false);
              }}
              style={{
                transform: isMenuOpen ? 'translate(-65px, -65px) scale(1)' : 'translate(0, 0) scale(0)',
                opacity: isMenuOpen ? 1 : 0,
                transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              className={`absolute w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-300 glass text-gray-400 hover:text-green-400 border border-white/10 hover:border-green-500/30 z-20 ${
                isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              title="Gelişmiş Odak Modunu Başlat"
            >
              <Maximize size={18} />
            </button>

            {/* Pomodoro Toggle Butonu (Sol - 180 derece) */}
            <button
              onClick={() => togglePanel('pomodoro')}
              style={{
                transform: isMenuOpen ? 'translate(-90px, 0px) scale(1)' : 'translate(0, 0) scale(0)',
                opacity: isMenuOpen ? 1 : 0,
                transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              className={`absolute w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 z-20 ${
                isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
              } ${
                activePanel === 'pomodoro'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/40 border-transparent'
                  : 'glass text-gray-400 hover:text-green-400 border border-white/10 hover:border-green-500/30'
              }`}
              title="Pomodoro"
            >
              <Timer size={20} />
            </button>

            {/* AI Chat Toggle Butonu (Sol Alt - 225 derece) */}
            <button
              onClick={() => togglePanel('ai')}
              style={{
                transform: isMenuOpen ? 'translate(-65px, 65px) scale(1)' : 'translate(0, 0) scale(0)',
                opacity: isMenuOpen ? 1 : 0,
                transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              className={`absolute w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 z-20 ${
                isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
              } ${
                activePanel === 'ai'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/40 border-transparent'
                  : 'glass text-gray-400 hover:text-green-400 border border-white/10 hover:border-green-500/30'
              }`}
              title="AI Asistan"
            >
              <MessageCircle size={20} />
            </button>

            {/* Ana Tetikleyici Buton (Yarım Daire - Site Teması) */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className={`absolute right-0 w-8 h-12 rounded-l-full rounded-r-none border-y border-l flex items-center justify-start pl-1.5 shadow-lg transition-all duration-300 z-30 ${
                isMenuOpen 
                  ? 'bg-green-600 text-white border-transparent shadow-green-900/50' 
                  : 'glass text-gray-400 hover:text-green-400 border-white/10 hover:border-green-500/30'
              }`}
              title="Odak ve Araçlar Menüsü"
            >
              <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}>
                {isMenuOpen ? <X size={16} /> : <Maximize size={16} />}
              </div>
            </button>
          </div>

          <FocusModeOverlay />

          {/* Pomodoro Panel (Yandan Açılan) */}
          <div
            className={`fixed right-[130px] top-1/2 -translate-y-1/2 z-[9998] transition-all duration-300 ease-out origin-right ${
              activePanel === 'pomodoro'
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
            }`}
          >
            <PomodoroWidget onOpenMusicPanel={() => setIsMusicPanelOpen(true)} />
          </div>

          {/* AI Chat Panel (Yandan Açılan) */}
          <div
            className={`fixed right-[130px] top-1/2 -translate-y-1/2 z-[9998] transition-all duration-300 ease-out origin-right ${
              activePanel === 'ai'
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
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
