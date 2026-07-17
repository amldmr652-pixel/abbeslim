'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Timer, MessageCircle, Maximize, X, SkipForward, SkipBack,
  Volume2, VolumeX, Heart, Play, Pause
} from 'lucide-react';
import AIChatWidget from './components/AIChatWidget';
import PomodoroWidget from './components/PomodoroWidget';
import Sidebar from './components/layout/Sidebar';
import { useMusicContext } from './context/MusicContext';
import { createClient } from '@/utils/supabase/client';
import { useSettingsStore } from '@/stores/useSettingsStore';


// Auth sayfaları — bu route'larda widget'lar gizlenir
const AUTH_ROUTES = ['/login', '/register', '/pending-approval'];

/**
 * Layout içinde client context'e erişip Sidebar + Widget'ları render eden sarmalayıcı.
 * Auth sayfalarında widget'lar gizlenir.
 * Widget'lar sağ üst köşede dropdown panel olarak açılır.
 */
import FocusModeOverlay from './components/FocusModeOverlay';
import { useFocusStore } from '@/stores/useFocusStore';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const {
    setIsMusicPanelOpen, isMusicPanelOpen, selectedChannelId, isMusicPlaying,
    activeChannel, activeTrack, currentSongTitle, currentSongArtist, currentTime,
    duration, volume, isMuted, setIsMusicPlaying, handlePrevTrack, handleNextTrack,
    toggleFavorite, setIsMuted, setVolume, seekTo, isLoadingTrack
  } = useMusicContext();

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
              if (pathname === '/music') {
                router.back();
              } else {
                router.push('/music');
              }
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



  // Panel dışına tıklanırsa kapat
  const handleBackdropClick = () => {
    setActivePanel('none');
    setIsMenuOpen(false);
  };

  const togglePanel = (panel: 'pomodoro' | 'ai') => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  // Time Formatter
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      <main className={`flex-1 overflow-y-auto ${selectedChannelId ? 'pb-24' : ''}`}>
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
              onClick={() => {
                togglePanel('pomodoro');
                setIsMenuOpen(false);
              }}
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

          {/* Pomodoro Panel (Yandan Açılan) */}
          <div
            className={`fixed right-[130px] top-1/2 -translate-y-1/2 z-[9998] transition-all duration-300 ease-out origin-right ${
              activePanel === 'pomodoro'
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
            }`}
          >
            <PomodoroWidget isDropdown={true} onOpenMusicPanel={() => { router.push('/music'); setIsMenuOpen(false); }} />
          </div>
        </>
      )}

      {/* Bottom Mini Player Bar */}
      {isAuthenticated && selectedChannelId && activeChannel && activeTrack && (
        <div 
          onClick={() => router.push('/music')}
          className={`fixed bottom-0 end-0 h-20 bg-stone-950/95 backdrop-blur-md border-t border-green-900/30 z-[9900] flex items-center justify-between px-6 cursor-pointer hover:bg-stone-900/80 transition-colors start-0 ${
            sidebarCollapsed ? 'md:start-[68px]' : 'md:start-[240px]'
          }`}
        >
          {/* Left section: song info */}
          <div className="flex items-center gap-3 min-w-0 max-w-[30%]">
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative overflow-hidden ${
                isMusicPlaying ? 'animate-spin [animation-duration:12s]' : ''
              }`}
              style={{ background: activeChannel.coverBg }}
            >
              {isLoadingTrack && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                </div>
              )}
              {activeChannel.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentSongTitle}</div>
              <div className="text-[10px] text-gray-400 truncate mt-0.5">{currentSongArtist}</div>
            </div>
          </div>

          {/* Middle section: playback controls & simple seek bar */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[40%]">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrevTrack(); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMusicPlaying(!isMusicPlaying); }}
                className="w-8 h-8 rounded-full bg-green-500 text-stone-950 flex items-center justify-center hover:scale-105 hover:bg-green-400 transition-all"
              >
                {isLoadingTrack ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent" />
                ) : isMusicPlaying ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNextTrack(); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Simple progress bar */}
            <div className="w-full flex items-center gap-2 px-4" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] text-gray-500 font-mono">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-stone-800 rounded-full appearance-none cursor-pointer accent-green-500 focus:outline-none"
              />
              <span className="text-[9px] text-gray-500 font-mono">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right section: volume & favorite */}
          <div className="flex items-center gap-4 min-w-0 max-w-[30%] justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(activeChannel.id); }}
              className={`transition-colors ${
                activeChannel.isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart size={16} fill={activeChannel.isFavorite ? 'currentColor' : 'none'} />
            </button>
            
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setIsMuted(false);
                  setVolume(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-1 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Odak Müzik Modalı kaldırıldı (Artık tam sayfa /music route'u var) */}
    </div>
  );
}
