'use client';

import { Search, BookOpen, Music } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMusicContext } from './context/MusicContext';
import AIChatWidget from './components/AIChatWidget';

// Dashboard Alt Bileşenleri
import GreetingWidget from './components/dashboard/GreetingWidget';
import QuickStats from './components/dashboard/QuickStats';
import TasksWidget from './components/dashboard/TasksWidget';
import QuickNoteWidget from './components/dashboard/QuickNoteWidget';
import RecentFilesWidget from './components/dashboard/RecentFilesWidget';
import GoalsWidget from './components/dashboard/GoalsWidget';

// Placeholder veriler (Faz 4, 6, 7'de veritabanına bağlanacak)
const PLACEHOLDER_TASKS = [
  { id: 1, title: 'Arapça ders notlarını tamamla', done: true },
  { id: 2, title: 'Fıkıh özetini gözden geçir', done: true },
  { id: 3, title: 'Hadis quiz\'ine çalış', done: false },
  { id: 4, title: 'Proje sunumunu hazırla', done: false },
  { id: 5, title: 'Haftalık planlamayı yap', done: false },
];

const PLACEHOLDER_FILES = [
  { id: 1, name: 'Fıkıh Usulü - Ders 14', type: 'pdf', date: '11 Tem' },
  { id: 2, name: 'Arapça Sarf Notları', type: 'pdf', date: '10 Tem' },
  { id: 3, name: 'Hadis Terminolojisi', type: 'docx', date: '9 Tem' },
];

const PLACEHOLDER_GOALS = [
  { id: 1, title: 'Arapça B2 seviyesi', progress: 45, color: 'bg-green-500' },
  { id: 2, title: '10 kitap oku', progress: 30, color: 'bg-blue-500' },
  { id: 3, title: 'Hafızlık programı', progress: 65, color: 'bg-purple-500' },
];

function DashboardContent() {
  const { setIsMusicPanelOpen } = useMusicContext();

  const completedTasks = PLACEHOLDER_TASKS.filter(t => t.done).length;
  const totalTasks = PLACEHOLDER_TASKS.length;

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
        workTimeHours={2}
        workTimeMinutes={45}
        monthlyExpense={245}
        activeGoalsCount={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.8s_ease-out]">
        <TasksWidget tasks={PLACEHOLDER_TASKS} />
        <QuickNoteWidget />
        <RecentFilesWidget files={PLACEHOLDER_FILES} />
        <GoalsWidget goals={PLACEHOLDER_GOALS} />
      </div>

      <AIChatWidget />
    </div>
  );
}

// SSR kapalı — client tarafında çalışan bileşenler ve zaman fonksiyonları var
const DashboardNoSSR = dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

export default function Home() {
  return <DashboardNoSSR />;
}
