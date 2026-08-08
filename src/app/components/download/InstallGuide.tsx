'use client';

import React, { useState } from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';

export default function InstallGuide() {
  const [openTab, setOpenTab] = useState<'windows' | 'android'>('windows');

  return (
    <div className="glass rounded-3xl p-8 border border-white/10 my-12">
      <h2 className="text-2xl font-bold text-white mb-6">Kurulum Rehberi</h2>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setOpenTab('windows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            openTab === 'windows'
              ? 'bg-green-500 text-black'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <Monitor size={16} />
          <span>Windows Kurulumu</span>
        </button>
        <button
          onClick={() => setOpenTab('android')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            openTab === 'android'
              ? 'bg-green-500 text-black'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <Smartphone size={16} />
          <span>Android Kurulumu (APK)</span>
        </button>
      </div>

      {/* Steps */}
      {openTab === 'windows' ? (
        <ol className="space-y-4 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">1</span>
            <span>Yukarıdaki <strong>"İndir (Windows)"</strong> butonuna tıklayarak <code>.exe</code> kurulum dosyasını indirin.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">2</span>
            <span>İndirilen dosyaya çift tıklayarak kurulum sihirbazını başlatın.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">3</span>
            <span>Kurulum tamamlandıktan sonra Masaüstü veya Başlat menüsünden <strong>abbeslim.</strong> uygulamasını çalıştırın.</span>
          </li>
        </ol>
      ) : (
        <ol className="space-y-4 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">1</span>
            <span>Yukarıdaki <strong>"İndir (Android)"</strong> butonuna tıklayarak <code>.apk</code> dosyasını telefonunuza indirin.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">2</span>
            <span>Telefonunuzun Ayarlar &gt; Güvenlik bölümünden <strong>"Bilinmeyen Kaynaklardan Yüklemeye İzin Ver"</strong> seçeneğini aktif edin.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs shrink-0">3</span>
            <span>İndirilen `.apk` dosyasına tıklayın ve "Yükle" seçeneğini seçin.</span>
          </li>
        </ol>
      )}
    </div>
  );
}
