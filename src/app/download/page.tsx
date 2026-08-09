'use client';

import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import DownloadHero from '../components/download/DownloadHero';
import PlatformCard from '../components/download/PlatformCard';
import FeatureGrid from '../components/download/FeatureGrid';
import InstallGuide from '../components/download/InstallGuide';
import SystemRequirements from '../components/download/SystemRequirements';
import FAQ from '../components/download/FAQ';

export default function DownloadPage() {
  const DOWNLOAD_URLS = {
    windows: 'https://github.com/amldmr652-pixel/abbeslim/releases/latest/download/abbeslim_1.0.0_x64-setup.exe',
    android: 'https://github.com/amldmr652-pixel/abbeslim/releases/latest/download/abbeslim-v1.0.0.apk',
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <DownloadHero />

      {/* Download Cards */}
      <div id="download-cards" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-12">
        <PlatformCard
          title="Windows Masaüstü"
          subtitle="Windows 10 & 11 (64-bit)"
          version="1.0.0"
          size="~128 MB"
          downloadUrl={DOWNLOAD_URLS.windows}
          icon={<Monitor size={32} />}
          badgeText="Masaüstü"
          recommended={true}
          features={[
            'Tauri 2 ile ultra hafif ve hızlı',
            'Sistem bildirimleri entegrasyonu',
            'Dahili otomatik güncelleme desteği',
            'Yerel önbellek ve anında bulut senkronizasyonu',
          ]}
        />

        <PlatformCard
          title="Android Mobil"
          subtitle="Android 8.0 ve üzeri"
          version="1.0.0"
          size="~160 MB"
          downloadUrl={DOWNLOAD_URLS.android}
          icon={<Smartphone size={32} />}
          badgeText="Mobil APK"
          features={[
            'Dokunmatik kontrollere özel tasarım',
            'Cihaz kamerasından not tarama desteği',
            'Mobil bildirimler ve widgetlar',
            'Düşük pil ve ram kullanımı',
          ]}
        />
      </div>

      {/* Features */}
      <FeatureGrid />

      {/* Install Guide */}
      <InstallGuide />

      {/* System Requirements */}
      <SystemRequirements />

      {/* FAQ */}
      <FAQ />
    </div>
  );
}
