'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Loader2 } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function GreetingWidget() {
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Saat ve Tarih Güncellemesi
    const updateTimeAndDate = () => {
      const now = new Date();
      // Saat formatlaması
      setCurrentTime(now.toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }));
      
      // Tarih formatlaması
      const dateStr = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      }).format(now);
      setFormattedDate(dateStr);

      // Karşılama mesajı hesaplaması
      const hour = now.getHours();
      if (hour < 6) setGreeting(t('dashboard.goodNight'));
      else if (hour < 12) setGreeting(t('dashboard.goodMorning'));
      else if (hour < 18) setGreeting(t('dashboard.goodAfternoon'));
      else setGreeting(t('dashboard.goodEvening'));
    };

    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 60000);
    return () => clearInterval(interval);
  }, [language, t]);

  useEffect(() => {
    // Hava Durumu Fetch
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (!apiKey) {
          setTimeout(() => {
            setWeather({ temp: 24, desc: language === 'en' ? 'Clear' : language === 'ar' ? 'صافي' : 'Açık', icon: 'sun' });
            setWeatherLoading(false);
          }, 1000);
          return;
        }

        const langParam = language === 'en' ? 'en' : language === 'ar' ? 'ar' : 'tr';
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Istanbul&units=metric&lang=${langParam}&appid=${apiKey}`);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.main.temp),
          desc: data.weather[0].description,
          icon: data.weather[0].main.toLowerCase()
        });
      } catch (error) {
        console.error("Hava durumu alınamadı:", error);
        setWeather({ temp: 20, desc: t('common.error'), icon: 'cloud' });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [language, t]);

  const getWeatherIcon = (iconName: string) => {
    if (iconName.includes('rain')) return <CloudRain size={20} className="text-blue-400" />;
    if (iconName.includes('sun') || iconName.includes('clear')) return <Sun size={20} className="text-yellow-400" />;
    return <Cloud size={20} className="text-gray-400" />;
  };

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-[fadeIn_0.5s_ease-out]">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          {greeting}, <span className="text-green-400">Kullanıcı</span> 👋
        </h1>
        <p className="text-gray-400 flex items-center gap-3">
          <span>{formattedDate}</span>
          <span className="text-green-600">•</span>
          <span className="text-green-400 font-mono">{currentTime}</span>
        </p>
      </div>

      {/* Hava Durumu Modülü */}
      <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-green-900/30">
        {weatherLoading ? (
          <Loader2 size={20} className="animate-spin text-green-500" />
        ) : (
          <>
            {getWeatherIcon(weather?.icon || 'cloud')}
            <div className="flex flex-col">
              <span className="text-white font-bold leading-tight">{weather?.temp}°C</span>
              <span className="text-xs text-gray-400 capitalize">{weather?.desc}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
