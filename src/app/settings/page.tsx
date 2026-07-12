'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Palette, Music, Upload, Check, Loader2, Save, Trash2, Camera } from 'lucide-react';
import { Card, Input, Button } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore, BreakSound, ThemeType } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme, breakSounds, selectedBreakSoundId, setSelectedBreakSoundId, addCustomBreakSound, removeCustomBreakSound } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'pomodoro'>('profile');
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [soundName, setSoundName] = useState('');
  const [soundUrl, setSoundUrl] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddSound = () => {
    if (!soundName.trim() || !soundUrl.trim()) return;
    
    addCustomBreakSound({
      id: `custom_${Date.now()}`,
      name: soundName,
      url: soundUrl,
      isCustom: true
    });
    
    setSoundName('');
    setSoundUrl('');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: <User size={18} /> },
    { id: 'theme', label: 'Görünüm', icon: <Palette size={18} /> },
    { id: 'pomodoro', label: 'Sesler', icon: <Music size={18} /> }
  ] as const;

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="text-green-500" size={32} />
          Ayarlar
        </h1>
        <p className="text-gray-400">Profilinizi, görünümü ve ses tercihlerinizi yapılandırın.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-medium transition-all text-left ${
                activeTab === tab.id 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                  : 'text-gray-400 hover:text-white glass'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Kişisel Bilgiler</h2>
                <div className="space-y-5 max-w-md">
                  {/* Avatar */}
                  <div className="flex items-center gap-6 pb-4 border-b border-white/10">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center text-3xl font-bold text-green-400 overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (fullName || user?.email || '?')[0].toUpperCase()
                        )}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera size={20} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          const ext = file.name.split('.').pop();
                          const filePath = `${user.id}/avatar.${ext}`;
                          const supabaseClient = createClient();
                          const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file, { upsert: true });
                          if (uploadError) { alert('Avatar yüklenemedi: ' + uploadError.message); return; }
                          const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                          const urlWithCacheBust = publicUrl + '?t=' + Date.now();
                          await supabaseClient.auth.updateUser({ data: { avatar_url: urlWithCacheBust } });
                          setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: urlWithCacheBust } });
                        }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{fullName || 'İsimsiz Kullanıcı'}</p>
                      <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">E-posta Adresi</label>
                    <Input 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-black/50 opacity-70"
                    />
                    <p className="text-xs text-gray-500 mt-2">E-posta adresi şu anda değiştirilemez.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Ad Soyad</label>
                    <Input 
                      value={fullName} 
                      onChange={setFullName} 
                      placeholder="Adınızı girin"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <Button onClick={handleUpdateProfile} disabled={isSavingProfile || !fullName.trim()} className="min-w-[120px]">
                      {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Kaydet'}
                    </Button>
                    {profileSuccess && (
                      <span className="text-sm text-green-400 flex items-center gap-2 animate-in fade-in">
                        <Check size={16} /> Başarıyla güncellendi!
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Tema Seçimi</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['dark', 'light', 'amoled'] as ThemeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        theme === t 
                          ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                          : 'border-transparent glass hover:border-gray-500/30'
                      }`}
                    >
                      {theme === t && (
                        <div className="absolute top-3 right-3 text-green-500">
                          <Check size={18} />
                        </div>
                      )}
                      <div className={`w-full h-24 rounded-lg mb-4 ${
                        t === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 
                        t === 'light' ? 'bg-gradient-to-br from-gray-100 to-white' : 
                        'bg-black'
                      }`} />
                      <div className="font-bold text-white capitalize">{t === 'amoled' ? 'AMOLED Siyah' : t === 'dark' ? 'Koyu' : 'Açık'}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-sm text-gray-500">Not: Tema değişikliği anlık olarak uygulanır. Dark (varsayılan), Açık ve AMOLED Siyah seçenekleri mevcuttur.</p>
              </Card>
            </div>
          )}

          {activeTab === 'pomodoro' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-2">Mola Sesleri</h2>
                <p className="text-gray-400 text-sm mb-6">Pomodoro molası başladığında çalacak rahatlatıcı doğa sesini seçin.</p>
                
                <div className="space-y-3 mb-8">
                  {breakSounds.map(sound => (
                    <div 
                      key={sound.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selectedBreakSoundId === sound.id 
                          ? 'bg-green-600/10 border-green-500/50' 
                          : 'glass border-transparent hover:border-gray-500/30 cursor-pointer'
                      }`}
                      onClick={() => setSelectedBreakSoundId(sound.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedBreakSoundId === sound.id ? 'border-green-500' : 'border-gray-500'
                        }`}>
                          {selectedBreakSoundId === sound.id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>
                        <span className={selectedBreakSoundId === sound.id ? 'text-white font-medium' : 'text-gray-300'}>{sound.name}</span>
                      </div>
                      
                      {sound.isCustom && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeCustomBreakSound(sound.id); }}
                          className="text-gray-500 hover:text-red-500 p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Kendi Sesini Ekle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Input 
                      placeholder="Ses Adı (Örn: Yağmur 2)" 
                      value={soundName}
                      onChange={setSoundName}
                    />
                    <Input 
                      placeholder="Ses URL'si (.mp3)" 
                      value={soundUrl}
                      onChange={setSoundUrl}
                    />
                  </div>
                  <Button onClick={handleAddSound} variant="secondary" className="w-full sm:w-auto" disabled={!soundName.trim() || !soundUrl.trim()}>
                    <Upload size={16} className="mr-2 inline" /> Ses Ekle
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
