'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { isWeb } from '@/utils/platform';

export default function DownloadWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isWeb()) {
    return null;
  }

  return (
    <div className="glass rounded-3xl p-6 border border-green-500/20 bg-gradient-to-br from-green-950/20 via-black/40 to-black/60 relative overflow-hidden group">
      {/* Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-green-500/20 transition-all" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
            <Download size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Masaüstü & Mobil Uygulamaları</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Ücretsiz</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              abbeslim. Life OS'u Windows ve Android cihazlarınıza indirin, daha hızlı çalışın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/download"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black text-sm font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105"
          >
            <span>Uygulamayı İndir</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
