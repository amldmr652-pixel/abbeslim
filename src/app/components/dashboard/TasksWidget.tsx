'use client';

import { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Task {
  id: number;
  title: string;
  done: boolean;
}

interface TasksWidgetProps {
  tasks: Task[];
}

export default function TasksWidget({ tasks: initialTasks }: TasksWidgetProps) {
  const { t } = useTranslation();
  // Faz 4 tamamlanana kadar yerel state ile mock yapıyoruz
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;

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
      <div className="space-y-3">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => toggleTask(task.id)}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              task.done
                ? 'bg-green-600 border-green-600'
                : 'border-gray-600 group-hover:border-green-500'
            }`}>
              {task.done && <span className="text-xs text-white">✓</span>}
            </div>
            <span className={`text-sm select-none transition-colors ${task.done ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-green-900/20">
        <button className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors">
          {t('dashboard.seeAllTasks')} <ChevronRight size={14} className="rtl:rotate-180" />
        </button>
      </div>
    </Card>
  );
}
