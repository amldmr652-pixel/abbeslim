'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';
import { 
  Timer as TimerIcon, BarChart2, Target, Calendar
} from 'lucide-react';
import { Button } from '@/app/components/ui';

export default function StudyPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Goal Form States
  const [dailyGoal, setDailyGoal] = useState(settings.workTimeDailyGoal || 120);
  const [weeklyGoal, setWeeklyGoal] = useState(settings.workTimeWeeklyGoal || 10);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    fetchSessions();
  }, []);

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
      {/* Main Container */}
      <div className="w-full max-w-[600px] flex flex-col flex-1 z-10">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <TimerIcon size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Çalışma Süresi Analizi</h1>
              <p className="text-xs text-gray-400">Çalışma sürelerinizi, hedeflerinizi ve seans geçmişinizi buradan takip edin.</p>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="glass rounded-[32px] p-8 border border-green-900/10 flex-1 flex flex-col justify-between relative min-h-[480px]">
          
          {loadingStats ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-t border-green-500"></div>
              <p className="text-xs text-gray-500">Veriler yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
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

              {/* Goal Settings Form */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400 mb-2">Çalışma Hedeyi Ayarları</h4>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
