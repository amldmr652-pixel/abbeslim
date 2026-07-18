'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/app/components/ui';
import { Clock, Target, Calendar, BarChart2, Settings, X, Check } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';

interface WorkTimePanelProps {
  onClose: () => void;
}

export default function WorkTimePanel({ onClose }: WorkTimePanelProps) {
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'details' | 'goals'>('details');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Time calculations
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
  const maxMinsInChart = Math.max(...chartData.map(d => d.minutes), 60); // minimum scale 60 mins

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="glass w-full max-w-[500px] rounded-[32px] p-6 relative animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(34,197,94,0.1)] bg-stone-950/95 border border-green-900/30 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Çalışma Süresi Analizi</h2>
            <p className="text-xs text-gray-400">Pomodoro seanslarınızdan derlenen istatistikler.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-full mb-6 border border-white/5">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'details' ? 'bg-green-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 size={14} />
            Özet & İstatistikler
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'goals' ? 'bg-green-500 text-stone-950 shadow-md font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={14} />
            Hedef Ayarları
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t border-green-500"></div>
            <p className="text-xs text-gray-500">Veriler yükleniyor...</p>
          </div>
        ) : activeTab === 'details' ? (
          <div className="space-y-6">
            {/* Goal Progress Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Bugünkü Hedef</span>
                  <span className="text-xs text-green-400 font-bold">{Math.floor(todayProgress)}%</span>
                </div>
                <div className="text-lg font-bold text-white mb-2">
                  {formatHoursAndMinutes(todayMinutes)}{' '}
                  <span className="text-gray-500 text-xs font-normal">/ {formatHoursAndMinutes(dailyGoal)}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${todayProgress}%` }} />
                </div>
              </div>

              <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Haftalık Hedef</span>
                  <span className="text-xs text-green-400 font-bold">{Math.floor(weeklyProgress)}%</span>
                </div>
                <div className="text-lg font-bold text-white mb-2">
                  {Math.floor(thisWeekMinutes / 60)}sa{' '}
                  <span className="text-gray-500 text-xs font-normal">/ {weeklyGoal}sa</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${weeklyProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="bg-stone-900/30 border border-white/5 rounded-3xl p-5">
              <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-wider text-gray-400">Son 7 Günlük Çalışma</h3>
              <div className="flex justify-between items-end h-32 px-2">
                {chartData.map((d, i) => {
                  const heightPercentage = Math.max(5, (d.minutes / maxMinsInChart) * 100);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="h-24 w-full flex items-end justify-center relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-stone-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-900/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {d.formatted}
                        </div>
                        {/* Bar */}
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

            {/* Stats Summary Grid */}
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
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Günlük Hedef (Dakika)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Math.max(15, parseInt(e.target.value) || 0))}
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-400 font-medium">dk</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Haftalık Hedef (Saat)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Math.max(1, parseInt(e.target.value) || 0))}
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-400 font-medium">saat</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center gap-2 mt-4"
              onClick={handleSaveGoals}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  Hedefler Güncellendi
                </>
              ) : (
                'Ayarları Kaydet'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
