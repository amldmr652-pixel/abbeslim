'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Calendar,
  StickyNote,
  CheckSquare,
  Target,
  Wallet,
  Library,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Gamepad2,
  LogOut,
  Clapperboard,
  Music,
  Map,
} from 'lucide-react';

import { useTranslation } from '@/app/hooks/useTranslation';
import type { Language } from '@/stores/useI18nStore';
import { useMusicContext } from '@/app/context/MusicContext';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  href?: string;
  action?: 'music';
  hasBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, href: '/' },
  { id: 'search', icon: <Search size={20} />, href: '/search' },
  { id: 'library', icon: <BookOpen size={20} />, href: '/library' },
  { id: 'calendar', icon: <Calendar size={20} />, href: '/calendar' },
  { id: 'notes', icon: <StickyNote size={20} />, href: '/notes' },
  { id: 'tasks', icon: <CheckSquare size={20} />, href: '/tasks' },
  { id: 'goals', icon: <Target size={20} />, href: '/goals' },
  { id: 'finance', icon: <Wallet size={20} />, href: '/finance' },
  { id: 'games', icon: <Gamepad2 size={20} />, href: '/games' },
  { id: 'tracker', icon: <Clapperboard size={20} />, href: '/tracker' },
  { id: 'map', icon: <Map size={20} />, href: '/map' },
  { id: 'music', icon: <Music size={20} />, href: '/music' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', icon: <Settings size={20} />, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { setIsMusicPanelOpen } = useMusicContext();
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useSettingsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Mobilde route değişince menüyü kapat
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ESC ile mobil menüyü kapat
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const hasBadge = item.hasBadge;
    const label = item.id === 'music' ? 'Odak Müzik' : t(`sidebar.${item.id}`);
    const badgeText = t('common.comingSoon');

    const content = (
      <>
        <span className={`flex-shrink-0 ${active ? 'text-green-400' : ''}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className={`text-sm font-medium truncate ${active ? 'text-green-300' : ''}`}>
              {label}
            </span>
            {hasBadge && (
              <span className="rtl:mr-auto ltr:ml-auto text-[10px] bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full border border-green-900/30 whitespace-nowrap">
                {badgeText}
              </span>
            )}
          </>
        )}
        {/* Collapsed modda tooltip */}
        {collapsed && (
          <div className="absolute rtl:right-full ltr:left-full rtl:mr-3 ltr:ml-3 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-green-900/20">
            {label}
            {hasBadge && <span className="mx-2 text-green-600">({badgeText})</span>}
          </div>
        )}
      </>
    );

    const className = `
      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
      ${active
        ? 'bg-green-600/15 text-green-400 rtl:border-r-2 ltr:border-l-2 border-green-500 rtl:mr-[-1px] ltr:ml-[-1px]'
        : hasBadge
          ? 'text-gray-600 cursor-not-allowed'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }
    `;

    if (item.action === 'music') {
      return (
        <button
          key={item.id}
          onClick={() => setIsMusicPanelOpen(true)}
          className={`w-full text-left ${className}`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.id}
        href={hasBadge ? '#' : (item.href || '#')}
        className={className}
      >
        {content}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-5 border-b border-green-900/20`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wider text-green-500">abbeslim.</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="text-green-500 font-bold text-lg">a.</Link>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Ana navigasyon */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      {/* Alt kısım */}
      <div className="px-3 py-4 border-t border-green-900/20 space-y-1">
        {BOTTOM_ITEMS.map(renderNavItem)}
        
        {/* Çıkış Yap Butonu */}
        <button
          onClick={handleLogout}
          className={`
            w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
            text-red-400 hover:text-red-300 hover:bg-red-900/10 mt-2
          `}
        >
          <span className="flex-shrink-0"><LogOut size={20} /></span>
          {!collapsed && <span className="text-sm font-medium truncate">{t('sidebar.logout')}</span>}
          {collapsed && (
            <div className="absolute rtl:right-full ltr:left-full rtl:mr-3 ltr:ml-3 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-red-900/20">
              {t('sidebar.logout')}
            </div>
          )}
        </button>

        {/* Dil Seçici */}
        <div className={`mt-4 pt-4 border-t border-green-900/20 flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
          {!collapsed && <span className="text-xs text-gray-500 px-2 uppercase font-bold tracking-wider">{t('sidebar.language')}</span>}
          <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-1 px-1`}>
            {(['tr', 'en', 'ar'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === lang 
                    ? 'bg-green-600 text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={t(`language.${lang}`)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobil hamburger butonu */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl glass text-green-500 hover:text-green-400 transition-colors"
        aria-label="Menüyü aç"
      >
        <Menu size={22} />
      </button>

      {/* Mobil overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobil drawer */}
      <aside
        className={`
          md:hidden fixed top-0 rtl:right-0 ltr:left-0 h-full z-50 bg-[#0a0a0a] rtl:border-l ltr:border-r border-green-900/20
          flex flex-col w-64 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 rtl:left-4 ltr:right-4 p-1 text-gray-500 hover:text-white"
          aria-label="Menüyü kapat"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col h-screen sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl
          rtl:border-l ltr:border-r border-green-900/20 transition-all duration-300 flex-shrink-0
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
