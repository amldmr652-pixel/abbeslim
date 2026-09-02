'use client';

import { useEffect, useState } from 'react';
import { useFocusStore } from '@/stores/useFocusStore';
import { usePomodoroTimer, MODE_LABELS } from '@/app/hooks/usePomodoroTimer';
import { useMusicContext } from '@/app/context/MusicContext';
import { useTaskStore } from '@/stores/useTaskStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRouter } from 'next/navigation';
import { 
  Play, Pause, Square, SkipForward, SkipBack, X, Maximize, 
  Music, Volume2, VolumeX, Radio, ChevronDown, Sparkles, Settings 
} from 'lucide-react';

export default function FocusModeOverlay() {
  const { isFocusModeActive, setFocusMode } = useFocusStore();
  const { 
    timeLeft, currentMode, isRunning, startTimer, pauseTimer, 
    resetTimer, switchMode, skipSession, isFinished, isShaking,
    settings: pomodoroSettings, saveSettings
  } = usePomodoroTimer();

  const settingsStore = useSettingsStore();

  const {
    channels,
    selectedChannelId,
    handleSelectChannel,
    isMusicPlaying,
    setIsMusicPlaying,
    activeChannel,
    activeTrack,
    currentSongTitle,
    currentSongArtist,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    handleNextTrack,
    handlePrevTrack,
  } = useMusicContext();

  const { tasks } = useTaskStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFocusModeActive) {
      // Enter Fullscreen if possible
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      // Exit Fullscreen
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFocusModeActive]);

  if (!mounted || !isFocusModeActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const urgentTasks = tasks.filter(t => !t.is_completed).slice(0, 3);

  const displayTitle = currentSongTitle || activeTrack?.title || activeChannel?.name || 'Odak Radyosu';
  const displayArtist = currentSongArtist || activeTrack?.artist || 'Canlı Akış';

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/15 via-black to-black pointer-events-none"></div>

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 md:p-6 z-20 relative">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
            {(['pomodoro', 'shortBreak', 'longBreak'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  currentMode === mode 
                    ? 'bg-green-500 text-stone-950 font-bold shadow-lg shadow-green-500/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>

          {/* Focus Music Toggle Button */}
          <button 
            onClick={() => {
              setShowMusicPanel(!showMusicPanel);
              if (!showMusicPanel) setShowSettingsPanel(false);
            }}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 border ${
              showMusicPanel 
                ? 'bg-green-500 text-stone-950 border-green-400 font-bold shadow-lg shadow-green-500/20' 
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Music size={16} className={isMusicPlaying ? 'animate-bounce text-green-400' : ''} />
            <span>Odak Müziği</span>
            {isMusicPlaying && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block" />
            )}
            <ChevronDown size={14} className={`transition-transform ${showMusicPanel ? 'rotate-180' : ''}`} />
          </button>

          {/* Pomodoro Settings Button */}
          <button
            onClick={() => {
              setShowSettingsPanel(!showSettingsPanel);
              if (!showSettingsPanel) setShowMusicPanel(false);
            }}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 border ${
              showSettingsPanel
                ? 'bg-green-500 text-stone-950 border-green-400 font-bold shadow-lg shadow-green-500/20'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings size={16} />
            <span>Pomodoro Ayarları</span>
            <ChevronDown size={14} className={`transition-transform ${showSettingsPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Exit Focus Mode Button */}
        <button 
          onClick={() => setFocusMode(false)}
          className="p-2.5 md:px-4 md:py-2 bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/60 rounded-full transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
        >
          <X size={18} />
          <span className="hidden sm:inline">Odak Modundan Çık</span>
        </button>
      </div>

      {/* Inline Focus Music Panel */}
      {showMusicPanel && (
        <div className="z-30 px-4 md:px-6 max-w-2xl mx-auto w-full animate-[slideDown_0.3s_ease-out]">
          <div className="glass p-5 rounded-3xl border border-green-500/20 bg-stone-950/90 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg shrink-0">
                  {activeChannel?.icon || '🎵'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{displayTitle}</h4>
                  <p className="text-xs text-gray-400 truncate">{displayArtist}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowMusicPanel(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Radyo & Ses Kanalı Seçin</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {channels.map((ch) => {
                  const isSelected = ch.id === selectedChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        handleSelectChannel(ch.id);
                        setIsMusicPlaying(true);
                      }}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                        isSelected 
                          ? 'bg-green-500 text-stone-950 border-green-400 font-bold shadow-md shadow-green-500/20' 
                          : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{ch.icon}</span>
                      <span>{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevTrack}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
                  title="Önceki Parça"
                >
                  <SkipBack size={18} />
                </button>

                <button
                  onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${
                    isMusicPlaying 
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950' 
                      : 'bg-green-500 hover:bg-green-400 text-stone-950'
                  }`}
                >
                  {isMusicPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
                  title="Sonraki Parça"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-48">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition-all shrink-0"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-full accent-green-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Focus Pomodoro Settings Panel */}
      {showSettingsPanel && (
        <div className="z-30 px-4 md:px-6 max-w-2xl mx-auto w-full animate-[slideDown_0.3s_ease-out]">
          <div className="glass p-5 rounded-3xl border border-green-500/20 bg-stone-950/90 backdrop-blur-xl shadow-2xl space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-green-500" />
                <h4 className="text-sm font-bold text-white">Pomodoro Zaman Ayarları</h4>
              </div>
              <button 
                onClick={() => setShowSettingsPanel(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Odak (Dakika)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={pomodoroSettings.pomodoro}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, pomodoro: Math.max(1, parseInt(e.target.value) || 25) })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Kısa Mola (Dakika)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomodoroSettings.shortBreak}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, shortBreak: Math.max(1, parseInt(e.target.value) || 5) })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Uzun Mola (Dakika)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomodoroSettings.longBreak}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, longBreak: Math.max(1, parseInt(e.target.value) || 15) })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Uzun Mola Aralığı (Pomodoro Sayısı)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={pomodoroSettings.longBreakInterval}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, longBreakInterval: Math.max(1, parseInt(e.target.value) || 3) })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Mola Sesi</label>
                <select
                  value={settingsStore.selectedBreakSoundId}
                  onChange={(e) => settingsStore.setSelectedBreakSoundId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-green-500 outline-none cursor-pointer"
                >
                  {(settingsStore.breakSounds || []).map(sound => (
                    <option key={sound.id} value={sound.id} className="bg-stone-900">
                      {sound.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-300 font-medium">
                <input
                  type="checkbox"
                  checked={pomodoroSettings.autoStartBreaks}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, autoStartBreaks: e.target.checked })}
                  className="w-4 h-4 accent-green-500 rounded cursor-pointer"
                />
                <span>Molaları Otomatik Başlat</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-300 font-medium">
                <input
                  type="checkbox"
                  checked={pomodoroSettings.autoStartPomodoros}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, autoStartPomodoros: e.target.checked })}
                  className="w-4 h-4 accent-green-500 rounded cursor-pointer"
                />
                <span>Pomodoro'ları Otomatik Başlat</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
        <div className="flex items-center gap-2 text-green-400 font-medium mb-6 tracking-widest uppercase text-sm md:text-base">
          <Sparkles size={18} className="animate-pulse" />
          <span>{MODE_LABELS[currentMode]}</span>
        </div>
        
        <div className={`text-[8rem] sm:text-[11rem] md:text-[13rem] leading-none font-bold tabular-nums mb-8 md:mb-12 tracking-tighter text-white font-mono select-none drop-shadow-[0_0_50px_rgba(34,197,94,0.15)] ${
          isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}>
          {timeString}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isRunning 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950 shadow-yellow-500/20' 
                : 'bg-green-500 hover:bg-green-400 text-stone-950 hover:scale-105 shadow-green-500/30'
            }`}
            title={isRunning ? 'Duraklat' : 'Başlat'}
          >
            {isRunning ? <Pause size={36} className="fill-current" /> : <Play size={36} className="fill-current ml-1" />}
          </button>

          <button
            onClick={() => resetTimer()}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Sıfırla"
          >
            <Square size={22} className="fill-current" />
          </button>

          <button
            onClick={skipSession}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Geç"
          >
            <SkipForward size={22} className="fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Urgent Tasks */}
      <div className="p-6 z-10 flex flex-col items-center opacity-75 hover:opacity-100 transition-opacity">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Öncelikli Görevler</h3>
        {urgentTasks.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3">
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 text-gray-200">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {task.title}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs">Bekleyen görev yok.</p>
        )}
      </div>
    </div>
  );
}
