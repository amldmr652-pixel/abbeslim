'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Music } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMusicContext } from './context/MusicContext';
import { createClient } from '@/utils/supabase/client';

// Dashboard Alt Bileşenleri
import GreetingWidget from './components/dashboard/GreetingWidget';
import QuickStats from './components/dashboard/QuickStats';
import TasksWidget from './components/dashboard/TasksWidget';
import QuickNoteWidget from './components/dashboard/QuickNoteWidget';
import RecentFilesWidget from './components/dashboard/RecentFilesWidget';
import GoalsWidget from './components/dashboard/GoalsWidget';

import { useTaskStore } from '@/stores/useTaskStore';
import { useGoalStore } from '@/stores/useGoalStore';

function DashboardContent() {
  const { setIsMusicPanelOpen } = useMusicContext();
  const { tasks } = useTaskStore();
  const { goals, fetchGoals } = useGoalStore();
  
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(0);

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  const activeGoalsCount = goals.length;

  useEffect(() => {
    fetchGoals();
    
    const fetchDashboardData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Son 5 açılan dosyayı çek
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('userId', user.id)
        .order('last_opened_at', { ascending: false, nullsFirst: false })
        .limit(5);

      if (files) {
        // format for RecentFilesWidget
        const formattedFiles = files.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.name.split('.').pop() || 'file',
          date: new Date(f.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        }));
        setRecentFiles(formattedFiles);
      }

      // Pomodoro toplam süreyi hesapla
      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('mode', 'pomodoro'); // sadece odaklanma süresi

      if (sessions) {
        const totalMin = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        setTotalWorkMinutes(totalMin);
      }
    };

    fetchDashboardData();
  }, [fetchGoals]);

  const workTimeHours = Math.floor(totalWorkMinutes / 60);
  const workTimeMinutes = totalWorkMinutes % 60;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <GreetingWidget />

      {/* Hızlı Erişim Butonları */}
      <div className="flex gap-3 mb-8 flex-wrap animate-[fadeIn_0.6s_ease-out]">
        <Link href="/search" className="glass px-5 py-2.5 rounded-full flex items-center gap-2 text-sm text-gray-300 hover:text-green-400 hover:border-green-500/30 transition-all shadow-lg">
          <Search size={16} /> Arama
        </Link>
        <Link href="/library" className="glass px-5 py-2.5 rounded-full flex items-center gap-2 text-sm text-gray-300 hover:text-green-400 hover:border-green-500/30 transition-all shadow-lg">
          <BookOpen size={16} /> Kütüphane
        </Link>
        <button
          onClick={() => setIsMusicPanelOpen(true)}
          className="glass px-5 py-2.5 rounded-full flex items-center gap-2 text-sm text-gray-300 hover:text-green-400 hover:border-green-500/30 transition-all shadow-lg"
        >
          <Music size={16} /> Odak Müzik
        </button>
      </div>

      <QuickStats 
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        workTimeHours={workTimeHours}
        workTimeMinutes={workTimeMinutes}
        monthlyExpense={0} // Faz 8
        activeGoalsCount={activeGoalsCount}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.8s_ease-out]">
        <TasksWidget />
        <QuickNoteWidget />
        <RecentFilesWidget files={recentFiles} />
        <GoalsWidget goals={goals} />
      </div>
    </div>
  );
}

// SSR kapalı — client tarafında çalışan bileşenler ve zaman fonksiyonları var
const DashboardNoSSR = dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

export default function Home() {
  return <DashboardNoSSR />;
}
