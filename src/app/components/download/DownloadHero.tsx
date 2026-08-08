'use client';

import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

export default function DownloadHero() {
  const scrollToCards = () => {
    const el = document.getElementById('download-cards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center pt-12 pb-8 text-center">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
        <Sparkles size={16} />
        <span>Masaüstü & Mobil Uygulamaları</span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 max-w-3xl">
        <span className="text-green-500">abbeslim.</span> her yerde seninle
      </h1>

      {/* Description */}
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-8">
        Kişisel kontrol merkezinize Windows ve Android cihazlarınızdan daha hızlı, daha güvenli ve çevrimdışı erişin.
      </p>

      {/* Action button */}
      <button
        onClick={scrollToCards}
        className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold transition-all shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95"
      >
        <span>Uygulamaları İncele</span>
        <ArrowDown size={18} />
      </button>
    </div>
  );
}
