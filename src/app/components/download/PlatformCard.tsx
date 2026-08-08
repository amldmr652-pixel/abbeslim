'use client';

import React from 'react';
import { Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface PlatformCardProps {
  title: string;
  subtitle: string;
  version: string;
  size: string;
  downloadUrl: string;
  icon: React.ReactNode;
  badgeText?: string;
  features: string[];
  recommended?: boolean;
}

export default function PlatformCard({
  title,
  subtitle,
  version,
  size,
  downloadUrl,
  icon,
  badgeText,
  features,
  recommended = false,
}: PlatformCardProps) {
  return (
    <div
      className={`glass rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 relative border ${
        recommended
          ? 'border-green-500/50 shadow-xl shadow-green-500/10'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {badgeText && (
        <div className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-green-500 text-black text-xs font-bold uppercase tracking-wider">
          {badgeText}
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
        </div>

        {/* Specs Info */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-black/40 border border-white/5 mb-6 text-xs text-gray-400">
          <div>Sürüm: <span className="text-white font-medium">{version}</span></div>
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div>Boyut: <span className="text-white font-medium">{size}</span></div>
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="flex items-center gap-1 text-green-400">
            <ShieldCheck size={14} />
            <span>Virüssüz</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Download Button */}
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
      >
        <Download size={20} />
        <span>İndir ({title})</span>
      </a>
    </div>
  );
}
