'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Music, GripHorizontal } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMusicContext } from './context/MusicContext';
import { createClient } from '@/utils/supabase/client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Dashboard Alt Bileşenleri
import GreetingWidget from './components/dashboard/GreetingWidget';
import QuickStats from './components/dashboard/QuickStats';
import TasksWidget from './components/dashboard/TasksWidget';
import QuickNoteWidget from './components/dashboard/QuickNoteWidget';
import RecentFilesWidget from './components/dashboard/RecentFilesWidget';
import GoalsWidget from './components/dashboard/GoalsWidget';

import { useTaskStore } from '@/stores/useTaskStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function SortableWidgetWrapper({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 right-3 z-20 p-2 bg-black/50 text-gray-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:text-white hover:bg-green-600/50"
      >
        <GripHorizontal size={16} />
      </div>
      <div className="h-full">
        {children}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { setIsMusicPanelOpen } = useMusicContext();
  const { tasks } = useTaskStore();
  const { goals, fetchGoals } = useGoalStore();
  const { dashboardOrder, setDashboardOrder } = useSettingsStore();
  
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dashboardOrder.indexOf(active.id as string);
      const newIndex = dashboardOrder.indexOf(over.id as string);
      setDashboardOrder(arrayMove(dashboardOrder, oldIndex, newIndex));
    }
  };

  const widgetMap: Record<string, React.ReactNode> = {
    tasks: <TasksWidget />,
    quickNote: <QuickNoteWidget />,
    recentFiles: <RecentFilesWidget files={recentFiles} />,
    goals: <GoalsWidget goals={goals} />,
  };

  // Ensure any missing widgets from order are still shown
  const allWidgets = ['tasks', 'quickNote', 'recentFiles', 'goals'];
  const currentOrder = [...dashboardOrder];
  allWidgets.forEach(w => {
    if (!currentOrder.includes(w)) currentOrder.push(w);
  });

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={currentOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.8s_ease-out]">
            {currentOrder.map(id => (
              <SortableWidgetWrapper key={id} id={id}>
                {widgetMap[id]}
              </SortableWidgetWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// SSR kapalı — client tarafında çalışan bileşenler ve zaman fonksiyonları var
const DashboardNoSSR = dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

export default function Home() {
  return <DashboardNoSSR />;
}
