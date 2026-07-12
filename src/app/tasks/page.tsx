'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input, Modal, Badge } from '@/app/components/ui';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { CheckCircle2, Circle, Plus, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TasksPage() {
  const { t, language } = useTranslation();
  const { tasks, isLoading, fetchTasks, addTask, toggleTaskCompletion, deleteTask } = useTaskStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    await addTask({
      user_id: user.id,
      title: newTaskTitle,
      due_date: newTaskDate || null,
      is_completed: false,
      priority: 'medium',
    });

    setNewTaskTitle('');
    setNewTaskDate('');
    setIsAddModalOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.is_completed;
    if (filter === 'pending') return !task.is_completed;
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired')}</h2>
        <p className="text-gray-400">Görevlerinizi görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={32} />
            {t('sidebar.tasks')}
          </h1>
          <p className="text-gray-400">
            {tasks.filter(t => !t.is_completed).length} {t('tasks.pendingCount')}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> {t('tasks.newTask')}
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={filter === 'all' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('all')}
        >
          {t('common.all')}
        </Button>
        <Button 
          variant={filter === 'pending' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('pending')}
        >
          {t('tasks.pending')}
        </Button>
        <Button 
          variant={filter === 'completed' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setFilter('completed')}
        >
          {t('tasks.completed')}
        </Button>
      </div>

      {/* Görev Listesi */}
      <div className="space-y-3">
        {isLoading && tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-green-900/30 rounded-3xl bg-black/20">
            <p className="text-gray-500">{t('tasks.noTasks')}</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} hover className={`group transition-all duration-300 ${task.is_completed ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                  className="flex-shrink-0 focus:outline-none"
                >
                  {task.is_completed ? (
                    <CheckCircle2 size={24} className="text-green-500" />
                  ) : (
                    <Circle size={24} className="text-gray-400 hover:text-green-400 transition-colors" />
                  )}
                </button>
                
                <div className="flex-grow">
                  <h3 className={`text-lg font-medium text-white ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </h3>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar size={12} />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-all opacity-40 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Yeni Görev Modalı */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('tasks.newTask')}
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            label="Görev Adı"
            placeholder="Ne yapmak istiyorsun?"
            value={newTaskTitle}
            onChange={setNewTaskTitle}
            required
          />
          <Input
            type="date"
            label="Bitiş Tarihi (Opsiyonel)"
            value={newTaskDate}
            onChange={setNewTaskDate}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!newTaskTitle.trim() || isLoading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


