'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';
import { 
  Timer as TimerIcon, BarChart2, Settings, Clock, Target, Calendar, 
  ChevronLeft, Play, Pause, SkipForward, Volume2, VolumeX 
} from 'lucide-react';
import { usePomodoroTimer } from '@/app/hooks/usePomodoroTimer';
import { useMusicContext } from '@/app/context/MusicContext';
import PomodoroTimer from '@/app/components/pomodoro/PomodoroTimer';
import PomodoroSettings from '@/app/components/pomodoro/PomodoroSettings';
import { Card, Button } from '@/app/components/ui';

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <span>🔇</span>;
  if (volume < 0.4) return <span>🔈</span>;
  if (volume < 0.7) return <span>🔉</span>;
  return <span>🔊</span>;
}

export default function StudyPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const timerHook = usePomodoroTimer();
  
  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>('timer');
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Goal Form States
  const [dailyGoal, setDailyGoal] = useState(settings.workTimeDailyGoal || 120);
  const [weeklyGoal, setWeeklyGoal] = useState(settings.workTimeWeeklyGoal || 10);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Music Context for Mini Player
  const {
    selectedChannelId,
    setIsMusicPlaying,
    isMusicPlaying,
    activeChannel,
    activeTrack,
    handlePrevTrack,
    handleNextTrack,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isLoadingTrack
  } = useMusicContext();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('pomodoro_sessions')
          .select('duration_minutes, created_at')
          .eq('user_id', user.id)
          .eq('mode', 'pomodoro')
          .order('created_at', { ascending: false });

        if (data) {
          setSessions(data);
        }
      } catch (err) {
        console.error("Pomodoro seansları çekilemedi:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (activeTab === 'stats') {
      fetchSessions();
    }
  }, [activeTab]);

  // Time calculations for stats
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Start of this week (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).getTime();
  
  // Start of this month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Helper to sum minutes for a period
  const getWorkMinutesForPeriod = (startTime: number) => {
    return sessions
      .filter(s => new Date(s.created_at).getTime() >= startTime)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
  };

  const todayMinutes = getWorkMinutesForPeriod(startOfToday);
  const thisWeekMinutes = getWorkMinutesForPeriod(startOfThisWeek);
  const thisMonthMinutes = getWorkMinutesForPeriod(startOfThisMonth);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  // Daily and weekly goal progress
  const todayProgress = Math.min(100, (todayMinutes / dailyGoal) * 100);
  const weeklyProgress = Math.min(100, ((thisWeekMinutes / 60) / weeklyGoal) * 100);

  // Calculate daily data for the last 7 days bar chart
  const getLast7DaysData = () => {
    const data = [];
    const daysName = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      
      const daySessions = sessions.filter(s => {
        const time = new Date(s.created_at).getTime();
        return time >= startOfDay && time < endOfDay;
      });

      const dayMins = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      data.push({
        dayName: daysName[d.getDay()],
        minutes: dayMins,
        formatted: dayMins >= 60 ? `${Math.floor(dayMins / 60)}s ${dayMins % 60}d` : `${dayMins}d`
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();
  const maxMinsInChart = Math.max(...chartData.map(d => d.minutes), 60);

  const handleSaveGoals = () => {
    settings.updateSettings({
      workTimeDailyGoal: dailyGoal,
      workTimeWeeklyGoal: weeklyGoal
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const formatHoursAndMinutes = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs}sa ${m}dk` : `${m}dk`;
  };

  return (
    <div 
      className="min-h-screen p-6 md:p-8 flex flex-col items-center relative overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at top, #001a0d 0%, #000000 60%)'
      }}
    >
      <style>{`
        .study-tab-btn { transition: background-color 0.2s, color 0.2s, transform 0.1s; }
        .pomodoro-tab-btn { transition: background-color 0.2s, color 0.2s; }
        .pomodoro-icon-btn:hover { border-color: #22c55e !important; color: #22c55e !important; transform: scale(1.05); }
        .pomodoro-main-btn:hover { background-color: #16a34a !important; transform: scale(1.05); }
        .vol-slider { -webkit-appearance: none; appearance: none; height: 3px; border-radius: 3px; outline: none; cursor: pointer; background: linear-gradient(to right, #22c55e calc(var(--val)*100%), #444 calc(var(--val)*100%)); }
        .vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 11px; height: 11px; border-radius: 50%; background: #22c55e; cursor: pointer; }
      `}</style>

      {/* Main Container */}
      <div className="w-full max-w-[600px] flex flex-col flex-1 z-10">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <TimerIcon size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Çalışma Süresi</h1>
              <p className="text-xs text-gray-400">Odaklanın, mola verin ve istatistiklerinizi takip edin.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Süre Ayarları"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-black/40 p-1.5 rounded-full mb-8 border border-white/5 shadow-inner">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-3 text-sm font-semibold rounded-full study-tab-btn flex items-center justify-center gap-2 ${
              activeTab === 'timer' 
                ? 'bg-green-500 text-stone-950 font-bold shadow-lg shadow-green-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={16} />
            Süreölçer
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-semibold rounded-full study-tab-btn flex items-center justify-center gap-2 ${
              activeTab === 'stats' 
                ? 'bg-green-500 text-stone-950 font-bold shadow-lg shadow-green-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 size={16} />
            Analiz & Hedefler
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="glass rounded-[32px] p-8 border border-green-900/10 flex-1 flex flex-col justify-between relative min-h-[480px]">
          
          {/* Settings Modal (Overlay inside the card) */}
          {showSettings && (
            <div className="absolute inset-0 z-50 rounded-[32px] overflow-hidden">
              <PomodoroSettings
                initialSettings={timerHook.settings}
                onSave={timerHook.saveSettings}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}

          {activeTab === 'timer' ? (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              {/* Circular SVG Counter + controls */}
              <PomodoroTimer
                currentMode={timerHook.currentMode}
                timeLeft={timerHook.timeLeft}
                isRunning={timerHook.isRunning}
                isFinished={timerHook.isFinished}
                isShaking={timerHook.isShaking}
                pomodoroCount={timerHook.pomodoroCount}
                totalTimeForMode={timerHook.settings[timerHook.currentMode] * 60}
                switchMode={timerHook.switchMode}
                startTimer={timerHook.startTimer}
                pauseTimer={timerHook.pauseTimer}
                resetTimer={timerHook.resetTimer}
                skipSession={timerHook.skipSession}
              />

              <div className="text-sm font-semibold text-gray-400 mb-8 mt-2 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                🍅 {timerHook.pomodoroCount}. Seans tamamlandı
              </div>

              {/* Music Player widget */}
              {selectedChannelId && activeChannel && activeTrack && (
                <div className="w-full mt-6 pt-6 border-t border-white/5">
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 relative ${
                          isMusicPlaying && !isLoadingTrack ? 'animate-spin [animation-duration:12s]' : ''
                        }`}
                        style={{ background: activeChannel.coverBg }}
                      >
                        {isLoadingTrack ? (
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                          </div>
                        ) : activeChannel.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{activeTrack.title}</div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{activeChannel.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={handlePrevTrack} 
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => setIsMusicPlaying(p => !p)} 
                        className="w-9 h-9 rounded-full bg-green-500 text-stone-950 flex items-center justify-center text-xs font-bold hover:scale-105 hover:bg-green-400 transition-all"
                      >
                        {isMusicPlaying ? '⏸' : '▶'}
                      </button>
                      <button 
                        onClick={handleNextTrack} 
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                  
                  {/* Volume Bar */}
                  <div className="flex items-center gap-3 mt-3 px-1">
                    <button
                      onClick={() => setIsMuted(m => !m)}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <VolumeIcon muted={isMuted} volume={volume} />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (isMuted && v > 0) setIsMuted(false);
                      }}
                      className="vol-slider flex-1"
                      style={{ ['--val' as any]: isMuted ? 0 : volume } as React.CSSProperties}
                    />
                    <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                      {isMuted ? '0' : Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {loadingStats ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-t border-green-500"></div>
                  <p className="text-xs text-gray-500">Veriler yükleniyor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Goal Progress Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Bugünkü Hedef</span>
                        <span className="text-xs text-green-400 font-bold">{Math.floor(todayProgress)}%</span>
                      </div>
                      <div className="text-lg font-bold text-white mb-2">
                        {formatHoursAndMinutes(todayMinutes)}{' '}
                        <span className="text-gray-500 text-xs font-normal">/ {formatHoursAndMinutes(dailyGoal)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-850 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${todayProgress}%` }} />
                      </div>
                    </div>

                    <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Haftalık Hedef</span>
                        <span className="text-xs text-green-400 font-bold">{Math.floor(weeklyProgress)}%</span>
                      </div>
                      <div className="text-lg font-bold text-white mb-2">
                        {Math.floor(thisWeekMinutes / 60)}sa{' '}
                        <span className="text-gray-500 text-xs font-normal">/ {weeklyGoal}sa</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-850 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${weeklyProgress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-stone-900/30 border border-white/5 rounded-3xl p-5">
                    <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-wider text-gray-400">Son 7 Günlük Çalışma</h3>
                    <div className="flex justify-between items-end h-32 px-2">
                      {chartData.map((d, i) => {
                        const heightPercentage = Math.max(5, (d.minutes / maxMinsInChart) * 100);
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 group">
                            <div className="h-24 w-full flex items-end justify-center relative">
                              <div className="absolute bottom-full mb-1 bg-stone-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-900/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {d.formatted}
                              </div>
                              <div 
                                className="w-4 rounded-t bg-green-500 hover:bg-green-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                                style={{ height: `${heightPercentage}%` }} 
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold mt-2">{d.dayName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                      <Calendar className="text-green-500" size={18} />
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Bu Ay Toplam</p>
                        <p className="text-sm font-bold text-white">{formatHoursAndMinutes(thisMonthMinutes)}</p>
                      </div>
                    </div>

                    <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                      <Target className="text-green-500" size={18} />
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tüm Zamanlar</p>
                        <p className="text-sm font-bold text-white">{formatHoursAndMinutes(totalMinutes)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Goal Settings Form */}
              {!loadingStats && (
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400 mb-2">Çalışma Hedefi Ayarları</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Günlük Hedef (Dk)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Math.max(15, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-green-500/50 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Haftalık Hedef (Sa)</label>
                      <input
                        type="number"
                        min="1"
                        max="80"
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-green-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full flex items-center justify-center gap-2 mt-4"
                    onClick={handleSaveGoals}
                  >
                    {saveSuccess ? 'Hedefler Güncellendi' : 'Hedefleri Kaydet'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
