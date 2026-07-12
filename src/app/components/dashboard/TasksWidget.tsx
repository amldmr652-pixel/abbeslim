'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useTaskStore } from '@/stores/useTaskStore';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function TasksWidget() {
  const { t } = useTranslation();
  const { tasks, isLoading, fetchTasks, toggleTaskCompletion } = useTaskStore();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchTasks();
      }
    });
  }, [fetchTasks]);

  // Sadece bugünün görevlerini ve geçmişteki tamamlanmamış görevleri gösterelim
  const displayTasks = tasks.filter(t => {
    if (!t.due_date) return true; // Tarihi olmayanları göster
    const today = new Date().toISOString().split('T')[0];
    return t.due_date <= today || !t.is_completed;
  }).slice(0, 5); // En fazla 5 tane göster

  const completedCount = displayTasks.filter(t => t.is_completed).length;
  const totalCount = displayTasks.length;

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={18} className="text-green-400" /> {t('dashboard.todayTasks')}
        </h2>
        <span className="text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full rtl:mr-auto ltr:ml-auto">
          {completedCount}/{totalCount}
        </span>
      </div>
      <div className="space-y-3 min-h-[140px]">
        {!user ? (
          <p className="text-sm text-gray-500 text-center py-4">Giriş yapın</p>
        ) : isLoading && tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{t('common.loading')}</p>
        ) : displayTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Bugün için görev yok.</p>
        ) : (
          displayTasks.map(task => (
            <div 
              key={task.id} 
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                task.is_completed
                  ? 'bg-green-600 border-green-600'
                  : 'border-gray-600 group-hover:border-green-500'
              }`}>
                {task.is_completed && <span className="text-xs text-white">✓</span>}
              </div>
              <span className={`text-sm truncate select-none transition-colors ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                {task.title}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 pt-4 border-t border-green-900/20">
        <Link href="/tasks" className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors">
          {t('dashboard.seeAllTasks')} <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    </Card>
  );
}


