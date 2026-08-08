'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Bot, Search, BookOpen, Calendar, CheckSquare, Target, StickyNote,
  Clock, Sparkles, X, Quote, Compass, ArrowRight, ShieldCheck, Heart
} from 'lucide-react';
import { getRandomQuote, SpiritualQuote } from '@/data/verses';
import { useTranslation } from '@/app/hooks/useTranslation';
import { createClient } from '@/utils/supabase/client';

export default function HomePage() {
  const { t, language } = useTranslation();
  const [userName, setUserName] = useState<string>('Kullanıcı');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [activeQuote, setActiveQuote] = useState<SpiritualQuote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Sayfa açılışında rastgele bir ayet/hadis seç
    setActiveQuote(getRandomQuote());

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Kullanıcı');
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

  // Boş alana tıklanınca rastgele yeni bir ayet veya hadis göster
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Eğer tıklanan element buton veya kart ise tetikleme
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.no-quote-trigger')) {
      return;
    }
    setActiveQuote(getRandomQuote());
    setIsModalOpen(true);
  };

  return (
    <div 
      onClick={handleBackgroundClick}
      className="min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-between cursor-pointer select-none animate-[fadeIn_0.6s_ease-out]"
    >
      {/* Üst Kısım: Karşılama ve Canlı Saat */}
      <div className="space-y-4 no-quote-trigger">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl border border-green-900/30">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full mb-3">
              <Sparkles size={14} /> Life OS Kontrol Merkezi 🇵🇸
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Hoş Geldiniz, <span className="text-green-400">{userName}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Gününüz bereketli ve verimli geçsin. Boş alana tıklayarak ilham verici ayet ve hadisleri keşfedebilirsiniz.
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
        <div className="my-6 no-quote-trigger">
          <div className="glass p-6 md:p-8 rounded-3xl border border-green-500/20 bg-gradient-to-r from-green-950/20 via-black/40 to-red-950/20 relative overflow-hidden group hover:border-green-500/40 transition-all">
            <div className="absolute top-4 right-4 text-green-500/20 group-hover:text-green-500/40 transition-colors">
              <Quote size={64} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
                <Compass size={16} /> Günün {activeQuote.type === 'ayet' ? 'Âyeti' : 'Hadis-i Şerifi'}
              </div>

              <p className="text-right text-xl md:text-2xl font-serif leading-relaxed text-white text-emerald-200 dir-rtl" dir="rtl">
                {activeQuote.arabic}
              </p>

              <p className="text-base md:text-lg text-gray-200 font-medium italic">
                "{activeQuote.turkish}"
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                <span className="font-semibold text-green-400">{activeQuote.source}</span>
                <span className="text-[11px] text-gray-500">Boş alana tıklayarak başka bir söz görün ✨</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alt Kısım: Hızlı Erişim Kartları Grid */}
      <div className="no-quote-trigger">
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

      {/* Ayet & Hadis Popup Modalı */}
      {isModalOpen && activeQuote && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass bg-black/90 border border-green-500/40 p-8 rounded-3xl max-w-xl w-full relative shadow-2xl space-y-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">
              <Sparkles size={14} /> {activeQuote.type === 'ayet' ? 'Kutsal Âyet-i Kerîme' : 'Sahih Hadîs-i Şerîf'}
            </div>

            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-emerald-300 dir-rtl py-2" dir="rtl">
              {activeQuote.arabic}
            </p>

            <p className="text-lg text-white font-medium italic border-t border-b border-white/10 py-4">
              "{activeQuote.turkish}"
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span className="font-bold text-green-400">{activeQuote.source}</span>
              <button
                onClick={() => setActiveQuote(getRandomQuote())}
                className="text-xs text-green-400 hover:text-green-300 font-semibold underline flex items-center gap-1"
              >
                Başka Göster 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
