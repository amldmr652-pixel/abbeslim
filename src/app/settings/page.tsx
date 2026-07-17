'use client';

import { useState, useEffect } from 'react';
import {
  User, Settings, Palette, Music, Upload, Check, Loader2, Save, Trash2, Camera, Keyboard, X,
  Timer, Calendar, StickyNote, CheckSquare, Target, Wallet, Gamepad2, Clapperboard, Map, Info
} from 'lucide-react';
import { Card, Input, Button } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore, BreakSound, ThemeType } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';
import AvatarCropModal from '@/app/components/ui/AvatarCropModal';

type TabType = 'profile' | 'theme' | 'shortcuts' | 'music' | 'pomodoro' | 'calendar' | 'finance' | 'notes' | 'tasks' | 'goals' | 'tracker' | 'games' | 'map';

export default function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<any>(null);
  const [conflictError, setConflictError] = useState<{ action: string; shortcut: any } | null>(null);

  // Shortcut Recording Effect
  useEffect(() => {
    if (!recordingAction) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingAction(null);
        setRecordedKeys(null);
        return;
      }

      const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);

      const newShortcut = {
        key: isModifier ? '' : e.key,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey
      };

      if (!isModifier) {
        let conflictAction = null;
        for (const [act, conf] of Object.entries(settings.shortcuts || {})) {
          if (act === recordingAction) continue;
          if (conf &&
              conf.key.toUpperCase() === newShortcut.key.toUpperCase() &&
              conf.ctrlKey === newShortcut.ctrlKey &&
              conf.altKey === newShortcut.altKey &&
              conf.shiftKey === newShortcut.shiftKey &&
              conf.metaKey === newShortcut.metaKey) {
            conflictAction = act;
            break;
          }
        }

        if (conflictAction) {
          setConflictError({
            action: conflictAction,
            shortcut: newShortcut
          });
          setTimeout(() => setConflictError(null), 4000);
        } else {
          settings.setShortcut(recordingAction, newShortcut);
        }
        setRecordingAction(null);
        setRecordedKeys(null);
      } else {
        setRecordedKeys(newShortcut);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [recordingAction, settings.shortcuts, settings.setShortcut]);

  const renderShortcutKeys = (shortcut: any) => {
    if (!shortcut || (!shortcut.key && !shortcut.ctrlKey && !shortcut.altKey && !shortcut.shiftKey && !shortcut.metaKey)) {
      return <span className="text-gray-500 text-xs italic">{t('settings.noShortcut')}</span>;
    }

    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Win/Cmd');
    if (shortcut.key) {
      let k = shortcut.key.toUpperCase();
      if (k === ' ') k = 'Space';
      keys.push(k);
    }

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {keys.map((key, idx) => (
          <kbd
            key={idx}
            className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-mono font-bold shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
    );
  };

  const renderRecordingShortcut = () => {
    const keys = [];
    if (recordedKeys) {
      if (recordedKeys.ctrlKey) keys.push('Ctrl');
      if (recordedKeys.altKey) keys.push('Alt');
      if (recordedKeys.shiftKey) keys.push('Shift');
      if (recordedKeys.metaKey) keys.push('Win/Cmd');
      if (recordedKeys.key) {
        let k = recordedKeys.key.toUpperCase();
        if (k === ' ') k = 'Space';
        keys.push(k);
      }
    }

    return (
      <div className="flex items-center gap-2 animate-pulse">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1" />
        <span className="text-xs text-red-400 font-medium mr-2">{t('settings.statusRecording')}</span>
        {keys.length > 0 && (
          <div className="flex gap-1.5 items-center">
            {keys.map((key, idx) => (
              <kbd
                key={idx}
                className="px-2.5 py-1 bg-red-500/15 text-red-300 border border-red-500/20 rounded-lg text-xs font-mono font-bold shadow-sm"
              >
                {key}
              </kbd>
            ))}
          </div>
        )}
      </div>
    );
  };

  // User Profile
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [selectedCropImage, setSelectedCropImage] = useState<string | null>(null);

  const handleCropSave = async (croppedBlob: Blob) => {
    if (!user) return;
    try {
      const ext = 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;
      const supabaseClient = createClient();
      const file = new File([croppedBlob], `avatar.${ext}`, { type: 'image/jpeg' });
      
      const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) {
        alert('Avatar yüklenemedi: ' + uploadError.message);
        return;
      }
      
      const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
      const urlWithCacheBust = publicUrl + '?t=' + Date.now();
      
      await supabaseClient.auth.updateUser({ data: { avatar_url: urlWithCacheBust } });
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: urlWithCacheBust } });
      setSelectedCropImage(null);
    } catch (err: any) {
      console.error(err);
      alert('Resim yüklenirken bir hata oluştu.');
    }
  };

  // Pomodoro custom sound
  const [soundName, setSoundName] = useState('');
  const [soundUrl, setSoundUrl] = useState('');

  // Finance custom category
  const [newFinanceCategory, setNewFinanceCategory] = useState('');

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
    settings.addCustomBreakSound({
      id: `custom_${Date.now()}`,
      name: soundName,
      url: soundUrl,
      isCustom: true
    });
    setSoundName('');
    setSoundUrl('');
  };

  const handleAddFinanceCategory = () => {
    if (!newFinanceCategory.trim()) return;
    if (settings.financeCategories.includes(newFinanceCategory.trim())) {
      alert('Bu kategori zaten mevcut.');
      return;
    }
    settings.updateSettings({
      financeCategories: [...settings.financeCategories, newFinanceCategory.trim()]
    });
    setNewFinanceCategory('');
  };

  const handleRemoveFinanceCategory = (category: string) => {
    settings.updateSettings({
      financeCategories: settings.financeCategories.filter(c => c !== category)
    });
  };

  const sidebarGroups = [
    {
      title: '📋 GENEL',
      tabs: [
        { id: 'profile', label: 'Profil', icon: <User size={16} /> },
        { id: 'theme', label: 'Görünüm', icon: <Palette size={16} /> },
        { id: 'shortcuts', label: 'Kısayollar', icon: <Keyboard size={16} /> },
      ]
    },
    {
      title: '🔧 MODÜLLER',
      tabs: [
        { id: 'music', label: 'Müzik', icon: <Music size={16} /> },
        { id: 'pomodoro', label: 'Pomodoro & Odak', icon: <Timer size={16} /> },
        { id: 'calendar', label: 'Takvim', icon: <Calendar size={16} /> },
        { id: 'finance', label: 'Finans', icon: <Wallet size={16} /> },
        { id: 'notes', label: 'Notlar', icon: <StickyNote size={16} /> },
        { id: 'tasks', label: 'Görevler', icon: <CheckSquare size={16} /> },
        { id: 'goals', label: 'Hedefler', icon: <Target size={16} /> },
        { id: 'tracker', label: 'İzleme Takibi', icon: <Clapperboard size={16} /> },
        { id: 'games', label: 'Oyunlar', icon: <Gamepad2 size={16} /> },
        { id: 'map', label: 'Harita', icon: <Map size={16} /> },
      ]
    }
  ] as const;

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="text-green-500" size={32} />
          Ayarlar
        </h1>
        <p className="text-gray-400">Life OS kontrol panelinizi ve modülleri ihtiyaçlarınıza göre yapılandırın.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex flex-col gap-6 flex-shrink-0">
          {sidebarGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 px-2">
                {group.title}
              </span>
              {group.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left text-sm ${
                    activeTab === tab.id 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-3xl">
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Kişisel Bilgiler</h2>
                <div className="space-y-5 max-w-md">
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
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSelectedCropImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{fullName || 'İsimsiz Kullanıcı'}</p>
                      <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold">E-posta Adresi</label>
                    <Input 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-stone-900 border border-stone-850 opacity-70"
                    />
                    <p className="text-[10px] text-gray-500 mt-2">E-posta adresi şu anda değiştirilemez.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold font-semibold">Ad Soyad</label>
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

          {/* THEME */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Tema Seçimi</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['dark', 'light', 'amoled'] as ThemeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => settings.setTheme(t)}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        settings.theme === t 
                          ? 'border-green-500 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                          : 'border-transparent glass hover:border-gray-500/30'
                      }`}
                    >
                      {settings.theme === t && (
                        <div className="absolute top-3 right-3 text-green-500">
                          <Check size={18} />
                        </div>
                      )}
                      <div className={`w-full h-24 rounded-lg mb-4 ${
                        t === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5' : 
                        t === 'light' ? 'bg-gradient-to-br from-gray-100 to-white border border-gray-300' : 
                        'bg-black border border-stone-850'
                      }`} />
                      <div className="font-bold text-white capitalize">{t === 'amoled' ? 'AMOLED Siyah' : t === 'dark' ? 'Koyu' : 'Açık'}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-xs text-gray-500">Not: Tema değişikliği anlık olarak uygulanır. AMOLED Siyah seçeneği pikselleri tamamen kapatarak ekran güç tasarrufu sağlar.</p>
              </Card>
            </div>
          )}

          {/* SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{t('settings.shortcutsTitle')}</h2>
                    <p className="text-gray-400 text-sm">{t('settings.shortcutsSubtitle')}</p>
                  </div>
                  <Button 
                    onClick={settings.resetShortcuts} 
                    variant="secondary"
                    className="self-start sm:self-auto border border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    {t('settings.resetAll')}
                  </Button>
                </div>

                {conflictError && (
                  <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-200 text-sm flex items-center justify-between animate-in fade-in duration-200">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      {t('settings.conflictWarning').replace('{action}', t(`settings.actions.${conflictError.action}`))}
                    </span>
                    <button onClick={() => setConflictError(null)} className="text-red-400 hover:text-red-200 p-1">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-4 pl-6">İşlem / Sayfa</th>
                        <th className="p-4">Klavye Kısayolu</th>
                        <th className="p-4 pr-6 text-right">Düzenle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {Object.keys(settings.shortcuts || {}).map((action) => {
                        const shortcut = settings.shortcuts[action];
                        const isRecording = recordingAction === action;
                        
                        return (
                          <tr key={action} className="hover:bg-white/[0.02] transition-colors text-sm">
                            <td className="p-4 pl-6 font-medium text-white">
                              {t(`settings.actions.${action}`) || action}
                            </td>
                            <td className="p-4">
                              {isRecording ? (
                                renderRecordingShortcut()
                              ) : (
                                renderShortcutKeys(shortcut)
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right space-x-2">
                              {!isRecording ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setRecordingAction(action);
                                      setRecordedKeys(null);
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-green-500/10 text-gray-300 hover:text-green-400 border border-white/10 hover:border-green-500/20 transition-all cursor-pointer"
                                  >
                                    Değiştir
                                  </button>
                                  {shortcut && (
                                    <button
                                      onClick={() => settings.setShortcut(action, null)}
                                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                                    >
                                      Kaldır
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRecordingAction(null);
                                    setRecordedKeys(null);
                                  }}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                                >
                                  İptal
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* MUSIC */}
          {activeTab === 'music' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Müzik Ayarları</h2>
                <div className="space-y-6">
                  {/* Default Volume */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-300">Varsayılan Ses Seviyesi</span>
                      <span className="text-green-400 font-bold font-mono">{Math.round(settings.musicDefaultVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.musicDefaultVolume}
                      onChange={(e) => settings.updateSettings({ musicDefaultVolume: parseFloat(e.target.value) })}
                      className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Autoplay toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Girişte Otomatik Çal</span>
                      <span className="text-[10px] text-gray-500">Siteye giriş yaptığınızda müzik otomatik olarak çalmaya başlar.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ musicAutoplayOnLogin: !settings.musicAutoplayOnLogin })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.musicAutoplayOnLogin ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.musicAutoplayOnLogin ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Show mini player toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Alt Mini Player Çubuğu</span>
                      <span className="text-[10px] text-gray-500">Müzik etkinken ekranın altında küçük kontrol çubuğu gösterir.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ musicShowMiniPlayer: !settings.musicShowMiniPlayer })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.musicShowMiniPlayer ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.musicShowMiniPlayer ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Sleep timer preset selector */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan Uyku Zamanlayıcısı</label>
                    <select
                      value={settings.musicSleepTimer || ''}
                      onChange={(e) => settings.updateSettings({ musicSleepTimer: e.target.value ? parseInt(e.target.value) : null })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="">Zamanlayıcı Yok</option>
                      <option value="15">15 Dakika sonra kapan</option>
                      <option value="30">30 Dakika sonra kapan</option>
                      <option value="45">45 Dakika sonra kapan</option>
                      <option value="60">60 Dakika sonra kapan</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* POMODORO */}
          {activeTab === 'pomodoro' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Pomodoro & Odak Süreleri</h2>
                <div className="space-y-6">
                  {/* Slider grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>Çalışma Süresi</span>
                        <span className="text-green-400">{settings.pomodoroWork} dk</span>
                      </div>
                      <input
                        type="range" min="10" max="60" step="5"
                        value={settings.pomodoroWork}
                        onChange={(e) => settings.updateSettings({ pomodoroWork: parseInt(e.target.value) })}
                        className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>Kısa Mola</span>
                        <span className="text-green-400">{settings.pomodoroShortBreak} dk</span>
                      </div>
                      <input
                        type="range" min="1" max="20" step="1"
                        value={settings.pomodoroShortBreak}
                        onChange={(e) => settings.updateSettings({ pomodoroShortBreak: parseInt(e.target.value) })}
                        className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>Uzun Mola</span>
                        <span className="text-green-400">{settings.pomodoroLongBreak} dk</span>
                      </div>
                      <input
                        type="range" min="5" max="45" step="5"
                        value={settings.pomodoroLongBreak}
                        onChange={(e) => settings.updateSettings({ pomodoroLongBreak: parseInt(e.target.value) })}
                        className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Long Break Interval */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-300">
                      <span>Uzun Mola Aralığı</span>
                      <span className="text-green-400">{settings.pomodoroLongBreakInterval} Seans</span>
                    </div>
                    <input
                      type="range" min="1" max="8" step="1"
                      value={settings.pomodoroLongBreakInterval}
                      onChange={(e) => settings.updateSettings({ pomodoroLongBreakInterval: parseInt(e.target.value) })}
                      className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-500">Her kaç çalışma seansından sonra uzun mola verileceğini belirler.</span>
                  </div>

                  {/* Autostart triggers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between p-3 bg-stone-900/30 border border-white/5 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-gray-300 block">Molayı Otomatik Başlat</span>
                        <span className="text-[9px] text-gray-500">Seans bitince mola direkt devreye girer.</span>
                      </div>
                      <button
                        onClick={() => settings.updateSettings({ pomodoroAutoStartBreaks: !settings.pomodoroAutoStartBreaks })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          settings.pomodoroAutoStartBreaks ? 'bg-green-500' : 'bg-stone-700'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                          settings.pomodoroAutoStartBreaks ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-900/30 border border-white/5 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-gray-300 block">Seansı Otomatik Başlat</span>
                        <span className="text-[9px] text-gray-500">Mola bitince yeni seans direkt başlar.</span>
                      </div>
                      <button
                        onClick={() => settings.updateSettings({ pomodoroAutoStartPomodoros: !settings.pomodoroAutoStartPomodoros })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          settings.pomodoroAutoStartPomodoros ? 'bg-green-500' : 'bg-stone-700'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                          settings.pomodoroAutoStartPomodoros ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Break Sounds list (previously existing) */}
                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-sm font-bold text-white mb-2">Mola Sesleri</h3>
                    <p className="text-xs text-gray-500 mb-4">Pomodoro seansı tamamlanıp mola başladığında çalacak rahatlatıcı doğa sesini seçin.</p>
                    <div className="space-y-2 mb-4">
                      {settings.breakSounds.map(sound => (
                        <div 
                          key={sound.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs ${
                            settings.selectedBreakSoundId === sound.id 
                              ? 'bg-green-600/10 border-green-500/50' 
                              : 'glass border-transparent hover:border-gray-500/30 cursor-pointer'
                          }`}
                          onClick={() => settings.setSelectedBreakSoundId(sound.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              settings.selectedBreakSoundId === sound.id ? 'border-green-500' : 'border-gray-500'
                            }`}>
                              {settings.selectedBreakSoundId === sound.id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                            </div>
                            <span className={settings.selectedBreakSoundId === sound.id ? 'text-white font-medium' : 'text-gray-300'}>{sound.name}</span>
                          </div>
                          
                          {sound.isCustom && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); settings.removeCustomBreakSound(sound.id); }}
                              className="text-gray-500 hover:text-red-500 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-stone-900/30 border border-white/5 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-white mb-3">Kendi Sesini Ekle</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <Input 
                          placeholder="Ses Adı (Örn: Yağmur 2)" 
                          value={soundName}
                          onChange={setSoundName}
                          className="text-xs"
                        />
                        <Input 
                          placeholder="Ses URL'si (.mp3)" 
                          value={soundUrl}
                          onChange={setSoundUrl}
                          className="text-xs"
                        />
                      </div>
                      <Button onClick={handleAddSound} variant="secondary" className="text-xs py-2 px-4" disabled={!soundName.trim() || !soundUrl.trim()}>
                        <Upload size={14} className="mr-1.5 inline" /> Ses Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Takvim Ayarları</h2>
                <div className="space-y-5">
                  {/* Default View */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan Takvim Görünümü</label>
                    <div className="flex gap-2">
                      {['month', 'week'].map((view) => (
                        <button
                          key={view}
                          onClick={() => settings.updateSettings({ calendarDefaultView: view as 'month' | 'week' })}
                          className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold capitalize transition-all ${
                            settings.calendarDefaultView === view 
                              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                              : 'bg-transparent text-gray-400 border-stone-800 hover:border-gray-700'
                          }`}
                        >
                          {view === 'month' ? 'Aylık Görünüm' : 'Haftalık Görünüm'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* First day of week */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300">Haftanın İlk Günü</label>
                    <select
                      value={settings.calendarFirstDayOfWeek}
                      onChange={(e) => settings.updateSettings({ calendarFirstDayOfWeek: parseInt(e.target.value) as 0 | 1 })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="1">Pazartesi</option>
                      <option value="0">Pazar</option>
                    </select>
                  </div>

                  {/* Show tasks toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Görevleri Takvimde Göster</span>
                      <span className="text-[10px] text-gray-500">Bitiş tarihi olan görevlerinizi takvim ajandanızda gösterir.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ calendarShowTasks: !settings.calendarShowTasks })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.calendarShowTasks ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.calendarShowTasks ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Event default color */}
                  <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan Etkinlik Rengi</label>
                    <div className="flex flex-wrap gap-2">
                      {['#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#f97316'].map((color) => (
                        <button
                          key={color}
                          onClick={() => settings.updateSettings({ calendarEventColor: color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                            settings.calendarEventColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {settings.calendarEventColor === color && (
                            <Check size={14} className="text-stone-950 absolute inset-0 m-auto font-bold" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </Card>
            </div>
          )}

          {/* FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Finans Ayarları</h2>
                <div className="space-y-6">
                  {/* Currency */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan Para Birimi</label>
                    <select
                      value={settings.financeCurrency}
                      onChange={(e) => settings.updateSettings({ financeCurrency: e.target.value })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="₺">Türk Lirası (₺)</option>
                      <option value="$">Dolar ($)</option>
                      <option value="€">Euro (€)</option>
                      <option value="£">Sterlin (£)</option>
                    </select>
                  </div>

                  {/* Categories list */}
                  <div className="border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300 block mb-2">Harcama/Gelir Kategorileri</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {settings.financeCategories.map((cat) => (
                        <span 
                          key={cat} 
                          className="flex items-center gap-1 bg-stone-900 border border-stone-800 text-xs px-3 py-1.5 rounded-full text-white"
                        >
                          {cat}
                          <button 
                            onClick={() => handleRemoveFinanceCategory(cat)}
                            className="text-gray-500 hover:text-red-400 ml-1 p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 max-w-sm">
                      <Input
                        placeholder="Yeni kategori adı"
                        value={newFinanceCategory}
                        onChange={setNewFinanceCategory}
                        className="text-xs"
                      />
                      <Button onClick={handleAddFinanceCategory} className="text-xs shrink-0 py-2">
                        Kategori Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Not Ayarları</h2>
                <div className="space-y-6">
                  {/* Autosave Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Notları Otomatik Kaydet</span>
                      <span className="text-[10px] text-gray-500">Not üzerinde yazarken değişiklikleri otomatik olarak kaydeder.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ notesAutoSave: !settings.notesAutoSave })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.notesAutoSave ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.notesAutoSave ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Autosave Interval */}
                  {settings.notesAutoSave && (
                    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>Kaydetme Aralığı</span>
                        <span className="text-green-400">{settings.notesAutoSaveInterval} saniye</span>
                      </div>
                      <input
                        type="range" min="5" max="120" step="5"
                        value={settings.notesAutoSaveInterval}
                        onChange={(e) => settings.updateSettings({ notesAutoSaveInterval: parseInt(e.target.value) })}
                        className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Font Size */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan Yazı Boyutu</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => settings.updateSettings({ notesFontSize: sz })}
                          className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold capitalize transition-all ${
                            settings.notesFontSize === sz 
                              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                              : 'bg-transparent text-gray-400 border-stone-800 hover:border-gray-700'
                          }`}
                        >
                          {sz === 'small' ? 'Küçük' : sz === 'medium' ? 'Orta' : 'Büyük'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </Card>
            </div>
          )}

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Görev Ayarları</h2>
                <div className="space-y-6">
                  {/* Default Priority */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-300">Yeni Görevlerin Varsayılan Önceliği</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((pri) => (
                        <button
                          key={pri}
                          onClick={() => settings.updateSettings({ tasksDefaultPriority: pri })}
                          className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold capitalize transition-all ${
                            settings.tasksDefaultPriority === pri
                              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                              : 'bg-transparent text-gray-400 border-stone-800 hover:border-gray-700'
                          }`}
                        >
                          {pri === 'low' ? 'Düşük' : pri === 'medium' ? 'Orta' : 'Yüksek'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Completed Toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Tamamlanan Görevleri Göster</span>
                      <span className="text-[10px] text-gray-500">Tamamlanmış olan görevlerinizi listede göstermeye devam eder.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ tasksShowCompleted: !settings.tasksShowCompleted })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.tasksShowCompleted ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.tasksShowCompleted ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Default Sort By */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <label className="text-sm font-semibold text-gray-300">Görev Sıralama Şekli</label>
                    <select
                      value={settings.tasksSortBy}
                      onChange={(e) => settings.updateSettings({ tasksSortBy: e.target.value as 'date' | 'priority' | 'name' })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="date">Bitiş Tarihine Göre</option>
                      <option value="priority">Öncelik Seviyesine Göre</option>
                      <option value="name">Alfabetik İsime Göre</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Hedef & Alışkanlık Ayarları</h2>
                <div className="space-y-6">
                  {/* Goals show completed */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Tamamlanan Hedefleri Göster</span>
                      <span className="text-[10px] text-gray-500">Hedef listesinde ulaşılan hedefleri arşivlemeden göstermeye devam eder.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ goalsShowCompleted: !settings.goalsShowCompleted })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.goalsShowCompleted ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.goalsShowCompleted ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Habit streak toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <span className="text-sm font-semibold text-gray-300 block">Alışkanlık Serilerini Göster</span>
                      <span className="text-[10px] text-gray-500">Günlük alışkanlıkların kaç gün üst üste tamamlandığını (serisini) gösterir.</span>
                    </div>
                    <button
                      onClick={() => settings.updateSettings({ habitsShowStreak: !settings.habitsShowStreak })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        settings.habitsShowStreak ? 'bg-green-500' : 'bg-stone-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                        settings.habitsShowStreak ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TRACKER */}
          {activeTab === 'tracker' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Tracker (Kitap & Dizi) Ayarları</h2>
                <div className="space-y-6">
                  {/* Default Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-300">Varsayılan İçerik Türü</label>
                    <select
                      value={settings.trackerDefaultType}
                      onChange={(e) => settings.updateSettings({ trackerDefaultType: e.target.value as 'movie' | 'show' | 'book' })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="movie">Film</option>
                      <option value="show">Dizi / TV Show</option>
                      <option value="book">Kitap / Döküman</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* GAMES */}
          {activeTab === 'games' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Mini Oyun Ayarları</h2>
                <div className="space-y-6">
                  {/* Daily Playtime limit */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-semibold text-gray-300">
                      <span>Günlük Oyun Süresi Limiti</span>
                      <span className="text-green-400 font-bold">{settings.gamesDailyLimit} Dakika</span>
                    </div>
                    <input
                      type="range" min="5" max="60" step="5"
                      value={settings.gamesDailyLimit}
                      onChange={(e) => settings.updateSettings({ gamesDailyLimit: parseInt(e.target.value) })}
                      className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                      <Info size={12} /> Odak kaybını engellemek amacıyla günlük oyun süreniz tamamlandığında oyunlar otomatik kilitlenir.
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* MAP */}
          {activeTab === 'map' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-white mb-6">Harita Ayarları</h2>
                <div className="space-y-6">
                  {/* Map Style */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-300">Harita Stili</label>
                    <select
                      value={settings.mapTileStyle}
                      onChange={(e) => settings.updateSettings({ mapTileStyle: e.target.value as 'dark' | 'light' | 'satellite' })}
                      className="bg-black/50 border border-stone-800 rounded-2xl p-2.5 px-4 text-xs text-white focus:border-green-500 outline-none w-full"
                    >
                      <option value="dark">Koyu Harita (Modern Dark)</option>
                      <option value="light">Açık Harita (Clean Light)</option>
                      <option value="satellite">Uydu Görünümü (Satellite)</option>
                    </select>
                  </div>

                  {/* Zoom Level */}
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-300">
                      <span>Varsayılan Yakınlaştırma (Zoom)</span>
                      <span className="text-green-400 font-bold">{settings.mapDefaultZoom}x</span>
                    </div>
                    <input
                      type="range" min="3" max="18" step="1"
                      value={settings.mapDefaultZoom}
                      onChange={(e) => settings.updateSettings({ mapDefaultZoom: parseInt(e.target.value) })}
                      className="w-full accent-green-500 bg-stone-850 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
      {/* Crop modal */}
      {selectedCropImage && (
        <AvatarCropModal
          imageSrc={selectedCropImage}
          onClose={() => setSelectedCropImage(null)}
          onCrop={handleCropSave}
        />
      )}
    </div>
  );
}
