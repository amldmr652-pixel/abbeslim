'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Dashboard Alt Bileşenleri
import GreetingWidget from '@/app/components/dashboard/GreetingWidget';
import DownloadWidget from '@/app/components/dashboard/DownloadWidget';
import QuickStats from '@/app/components/dashboard/QuickStats';
import TasksWidget from '@/app/components/dashboard/TasksWidget';
import QuickNoteWidget from '@/app/components/dashboard/QuickNoteWidget';
import RecentFilesWidget from '@/app/components/dashboard/RecentFilesWidget';
import GoalsWidget from '@/app/components/dashboard/GoalsWidget';
import HabitsWidget from '@/app/components/dashboard/HabitsWidget';

import { useTaskStore } from '@/stores/useTaskStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFinanceStore } from '@/stores/useFinanceStore';

function SortableWidgetWrapper({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 50 : 1,
    opacity: transform ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 right-3 z-20 p-2 bg-green-900/60 text-green-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-grab hover:text-white hover:bg-green-600/70 hover:scale-110 shadow-lg border border-green-500/30"
        title="Sürükleyerek yerini değiştir"
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
  const { tasks, fetchTasks } = useTaskStore();
  const { goals, fetchGoals } = useGoalStore();
  const { dashboardOrder, setDashboardOrder } = useSettingsStore();
  const { fetchTransactions, getTotalExpense } = useFinanceStore();
  
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(0);

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  const activeGoalsCount = goals.length;

  useEffect(() => {
    fetchGoals();
    fetchTransactions();
    fetchTasks();
    
    const fetchDashboardData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Son 5 dosyayı çek
      const { data: files } = await supabase
        .from('files')
        .select('id, name, url, createdAt')
        .eq('user_id', user.id)
        .eq('isDeleted', false)
        .order('createdAt', { ascending: false })
        .limit(5);

      if (files && files.length > 0) {
        const formattedFiles = files.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.name.split('.').pop() || 'file',
          date: new Date(f.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          url: f.url || null
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
  }, [fetchGoals, fetchTransactions, fetchTasks]);

  const workTimeHours = Math.floor(totalWorkMinutes / 60);
  const workTimeMinutes = totalWorkMinutes % 60;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
    habits: <HabitsWidget />,
    quickNote: <QuickNoteWidget />,
    recentFiles: <RecentFilesWidget files={recentFiles} />,
    goals: <GoalsWidget goals={goals} />,
  };

  // Ensure any missing widgets from order are still shown
  const allWidgets = ['tasks', 'habits', 'quickNote', 'recentFiles', 'goals'];
  const currentOrder = [...dashboardOrder];
  allWidgets.forEach(w => {
    if (!currentOrder.includes(w)) currentOrder.push(w);
  });

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <DownloadWidget />
      <GreetingWidget />

      <QuickStats 
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        workTimeHours={workTimeHours}
        workTimeMinutes={workTimeMinutes}
        monthlyExpense={getTotalExpense()}
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

const DashboardNoSSR = dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

export default function DashboardPage() {
  return <DashboardNoSSR />;
}
