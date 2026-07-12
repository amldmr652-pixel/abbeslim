'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Loader2 } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { createClient } from '@/utils/supabase/client';

export default function GreetingWidget() {
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState<string>('Kullanıcı');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı');
      }
    };
    fetchUser();
  }, []);

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
          icon: data.weather[0].main.toLowerCase(),
          city: data.name,
          humidity: data.main.humidity,
          wind: data.wind.speed
        });
      } catch (error) {
        console.error("Hava durumu alınamadı:", error);
        setWeather({ temp: 20, desc: t('common.error'), icon: 'cloud', city: 'Bilinmiyor', humidity: 0, wind: 0 });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [language, t]);

  const getWeatherIcon = (iconName: string, size = 20) => {
    if (iconName.includes('rain')) return <CloudRain size={size} className="text-blue-400" />;
    if (iconName.includes('sun') || iconName.includes('clear')) return <Sun size={size} className="text-yellow-400" />;
    return <Cloud size={size} className="text-gray-400" />;
  };

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-[fadeIn_0.5s_ease-out]">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          {greeting}, <span className="text-green-400">{userName}</span> 🌟
        </h1>
        <p className="text-gray-400 flex items-center gap-3">
          <span>{formattedDate}</span>
          <span className="text-green-600">•</span>
          <span className="text-green-400 font-mono">{currentTime}</span>
        </p>
      </div>

      {/* Hava Durumu Modülü */}
      <button 
        onClick={() => setIsWeatherModalOpen(true)}
        className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-green-900/30 hover:border-green-500/50 hover:bg-white/5 transition-colors text-left"
      >
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
      </button>

      {/* Hava Durumu Detay Modalı */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsWeatherModalOpen(false)}>
          <div className="bg-black/90 border border-green-900/50 p-6 rounded-3xl w-full max-w-sm relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsWeatherModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 className="text-xl font-bold text-white mb-6 text-center">{t('dashboard.weatherDetails') || 'Hava Durumu Detayı'}</h2>
            
            <div className="flex flex-col items-center justify-center gap-4 mb-8">
              {getWeatherIcon(weather?.icon || 'cloud', 64)}
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{weather?.temp}°C</div>
                <div className="text-lg text-gray-300 capitalize">{weather?.desc}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900/20 p-4 rounded-2xl border border-green-900/30 flex flex-col items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Şehir</span>
                <span className="text-lg font-semibold text-white">{weather?.city || 'İstanbul'}</span>
              </div>
              <div className="bg-green-900/20 p-4 rounded-2xl border border-green-900/30 flex flex-col items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nem</span>
                <span className="text-lg font-semibold text-white">%{weather?.humidity || 0}</span>
              </div>
              <div className="col-span-2 bg-green-900/20 p-4 rounded-2xl border border-green-900/30 flex flex-col items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rüzgar</span>
                <span className="text-lg font-semibold text-white">{weather?.wind || 0} km/s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
