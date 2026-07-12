'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapClient = dynamic(() => import('./MapClient'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-140px)] rounded-3xl border border-white/10 flex items-center justify-center bg-black/40">
      <div className="text-gray-400 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        Harita Yükleniyor...
      </div>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <MapPin className="text-green-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white">Harita</h1>
            <p className="text-gray-400">Gezdiğiniz yerleri, gitmek istediğiniz mekanları ve önemli konumları haritada işaretleyin.</p>
          </div>
        </div>
      </div>

      <MapClient />
    </div>
  );
}
