'use client';

import React from 'react';

export default function SystemRequirements() {
  return (
    <div className="glass rounded-3xl p-8 border border-white/10 my-12">
      <h2 className="text-2xl font-bold text-white mb-6">Sistem Gereksinimleri</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Windows */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-400">🖥️ Windows Masaüstü</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">İşletim Sistemi</span>
              <span>Windows 10 / 11 (64-bit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Bellek (RAM)</span>
              <span>Minimum 4 GB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Depolama</span>
              <span>200 MB kullanılabilir alan</span>
            </div>
          </div>
        </div>

        {/* Android */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-400">📱 Android Mobil</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">İşletim Sistemi</span>
              <span>Android 8.0 (Oreo) veya üzeri</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Bellek (RAM)</span>
              <span>Minimum 2 GB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Depolama</span>
              <span>200 MB kullanılabilir alan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
