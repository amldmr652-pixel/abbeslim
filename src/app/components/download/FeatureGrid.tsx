'use client';

import React from 'react';
import { Zap, Shield, WifiOff } from 'lucide-react';

export default function FeatureGrid() {
  const features = [
    {
      icon: <Zap size={24} className="text-green-400" />,
      title: 'Maksimum Performans',
      desc: 'Tauri ve Capacitor altyapısı sayesinde minimum kaynak kullanımı ve anında açılış süresi.',
    },
    {
      icon: <WifiOff size={24} className="text-green-400" />,
      title: 'Çevrimdışı Çalışma',
      desc: 'İnternet bağlantınız olmasa bile notlarınıza, takviminize ve yerel verilerinize erişin.',
    },
    {
      icon: <Shield size={24} className="text-green-400" />,
      title: 'Tam Güvenlik & Gizlilik',
      desc: 'Verileriniz cihazınızda ve Supabase şifrelenmiş sunucularında güvende kalır.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
      {features.map((item, idx) => (
        <div key={idx} className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-3">
          <div className="p-3 rounded-2xl bg-green-500/10 w-fit border border-green-500/20">
            {item.icon}
          </div>
          <h3 className="text-lg font-bold text-white">{item.title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
