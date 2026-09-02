'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Bot, Search, BookOpen, Calendar, CheckSquare, Target, StickyNote,
  Clock, Sparkles, Quote, Compass, ArrowRight
} from 'lucide-react';
import { SPIRITUAL_QUOTES, SpiritualQuote } from '@/data/verses';
import { useTranslation } from '@/app/hooks/useTranslation';
import { createClient } from '@/utils/supabase/client';

export default function HomePage() {
  const { language } = useTranslation();

  const [userName, setUserName] = useState<string>('Kullanıcı');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial random quote
    setQuoteIndex(Math.floor(Math.random() * SPIRITUAL_QUOTES.length));

    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      const u = res?.data?.user;
      if (u) {
        setUserName(u.user_metadata?.full_name || u.email?.split('@')[0] || 'Kullanıcı');
      }
    });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }));
      setFormattedDate(new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      }).format(now));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [language]);

  const activeQuote: SpiritualQuote = SPIRITUAL_QUOTES[quoteIndex] || SPIRITUAL_QUOTES[0];

  const nextQuote = () => {
    setQuoteIndex(prev => (prev + 1) % SPIRITUAL_QUOTES.length);
  };

  const prevQuote = () => {
    setQuoteIndex(prev => (prev - 1 + SPIRITUAL_QUOTES.length) % SPIRITUAL_QUOTES.length);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;
    
    if (contextMenu) {
      setContextMenu(null);
      return;
    }
    nextQuote();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return (
    <div 
      onClick={handleBackgroundClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-between cursor-pointer select-none animate-[fadeIn_0.6s_ease-out]"
    >
      {/* Üst Kısım: Karşılama ve Canlı Saat */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl border border-green-900/30">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full mb-3">
              <Sparkles size={14} /> Life OS Kontrol Merkezi 🇵🇸
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Hoş Geldiniz, <span className="text-green-400">{userName}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Gününüz bereketli ve verimli geçsin. Boş alana tıklayarak sonraki ayete geçebilir, sağ tıklayarak önceki/sonraki arasında seçim yapabilirsiniz.
            </p>
          </div>

          <div className="flex flex-col md:items-end justify-center shrink-0">
            <div className="text-3xl md:text-4xl font-mono font-bold text-green-400 tracking-wider flex items-center gap-2">
              <Clock size={28} className="text-green-500 animate-pulse" />
              {currentTime}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Orta Kısım: Günün Ayet/Hadis Öne Çıkan Kartı */}
      {activeQuote && (
        <div className="my-6">
          <div className="glass p-6 md:p-8 rounded-3xl border border-green-500/20 bg-gradient-to-r from-green-950/20 via-black/40 to-red-950/20 relative overflow-hidden group hover:border-green-500/40 transition-all">
            <div className="absolute top-4 right-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
              <Quote size={64} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
                <Compass size={16} /> Günün {activeQuote.type === 'ayet' ? 'Âyeti' : 'Hadis-i Şerifi'}
              </div>

              {/* Arabic text with line-height and wrap protection */}
              <p 
                className="text-right text-xl md:text-3xl font-serif text-emerald-200 dir-rtl break-words leading-loose" 
                dir="rtl"
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
              >
                {activeQuote.arabic}
              </p>

              {/* Turkish translation */}
              <p className="text-base md:text-lg text-gray-200 font-medium italic break-words leading-relaxed">
                "{activeQuote.turkish}"
              </p>

              {/* Source block */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-gray-400 flex-wrap gap-2">
                <span className="font-semibold text-green-400 block">{activeQuote.source}</span>
                <span className="text-[11px] text-gray-500">Sol tık: Sonraki • Sağ tık/Basılı tut: Menü ✨</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alt Kısım: Hızlı Erişim Kartları Grid */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ArrowRight size={16} className="text-green-500" /> Hızlı Erişim Panoları
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {[
            { id: 'dashboard', title: 'Dashboard', desc: 'Rutinler & Görevler', icon: <LayoutDashboard size={22} />, href: '/dashboard', color: 'from-green-600/20 to-emerald-950/40 border-green-500/30 text-green-400' },
            { id: 'chat', title: 'AI Chat', desc: 'Yapay Zeka Asistanı', icon: <Bot size={22} />, href: '/chat', color: 'from-blue-600/20 to-slate-950/40 border-blue-500/30 text-blue-400' },
            { id: 'search', title: 'Arama', desc: 'Semantik Not Arama', icon: <Search size={22} />, href: '/search', color: 'from-purple-600/20 to-purple-950/40 border-purple-500/30 text-purple-400' },
            { id: 'library', title: 'Kütüphane', desc: 'Dosyalar & Klasörler', icon: <BookOpen size={22} />, href: '/library', color: 'from-orange-600/20 to-amber-950/40 border-orange-500/30 text-orange-400' },
            { id: 'calendar', title: 'Takvim', desc: 'Etkinlik Yönetimi', icon: <Calendar size={22} />, href: '/calendar', color: 'from-teal-600/20 to-teal-950/40 border-teal-500/30 text-teal-400' },
            { id: 'tasks', title: 'Görevler', desc: 'Yapılacaklar Listesi', icon: <CheckSquare size={22} />, href: '/tasks', color: 'from-emerald-600/20 to-green-950/40 border-emerald-500/30 text-emerald-400' },
            { id: 'goals', title: 'Hedefler', desc: 'Alışkanlık Takibi', icon: <Target size={22} />, href: '/goals', color: 'from-rose-600/20 to-red-950/40 border-rose-500/30 text-rose-400' },
            { id: 'notes', title: 'Notlar', icon: <StickyNote size={22} />, desc: 'Hızlı Fikirler', href: '/notes', color: 'from-indigo-600/20 to-indigo-950/40 border-indigo-500/30 text-indigo-400' },
          ].map(card => (
            <Link
              key={card.id}
              href={card.href}
              onClick={(e) => e.stopPropagation()}
              className={`glass p-4 rounded-2xl border bg-gradient-to-br transition-all duration-300 hover:scale-[1.03] group ${card.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-white transform group-hover:translate-x-1" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-green-300 transition-colors">{card.title}</h3>
              <p className="text-xs text-gray-400">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Sağ tık / Basılı tutma context menüsü */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-[61] glass border border-green-500/30 rounded-2xl shadow-2xl shadow-black/60 py-2 min-w-[180px] animate-[fadeIn_0.15s_ease-out]"
            style={{ left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : contextMenu.x), top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 100 : contextMenu.y) }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevQuote(); setContextMenu(null); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-green-500/10 transition-colors flex items-center gap-3"
            >
              ⏮ Önceki {activeQuote?.type === 'ayet' ? 'Ayet' : 'Hadis'}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextQuote(); setContextMenu(null); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-green-500/10 transition-colors flex items-center gap-3"
            >
              ⏭ Sonraki {activeQuote?.type === 'ayet' ? 'Ayet' : 'Hadis'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
