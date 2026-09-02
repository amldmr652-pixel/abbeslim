'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input, Modal, Badge } from '@/app/components/ui';
import { useTaskStore, Task } from '@/stores/useTaskStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { CheckCircle2, Circle, Plus, Calendar, Trash2, AlertCircle, Edit, ListTodo, CheckSquare, Square } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
}

export default function TasksPage() {
  const { t, language } = useTranslation();
  const settings = useSettingsStore();
  const { 
    tasks, isLoading, fetchTasks, addTask, toggleTaskCompletion, deleteTask, updateTask 
  } = useTaskStore();
  
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Filters & Sorting states
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'name'>('date');

  // Sync settings sort option
  useEffect(() => {
    if (settings.tasksSortBy) {
      setSortBy(settings.tasksSortBy);
    }
  }, [settings.tasksSortBy]);

  // Yeni Görev Modalı States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Düzenleme / Detay Modalı States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescText, setEditDescText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editSubtasks, setEditSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const data = res?.data;
      setUser(data?.user || null);
      if (data?.user) {
        fetchTasks();
      }
    });
  }, [fetchTasks]);

  // JSON Description Parser & Serializer helpers
  const parseDescription = (desc: string | null) => {
    if (!desc) return { text: '', subtasks: [] as Subtask[] };
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'subtasks' in parsed)) {
        return {
          text: parsed.text || '',
          subtasks: (parsed.subtasks || []) as Subtask[]
        };
      }
    } catch (e) {
      // Return as plain description
    }
    return { text: desc, subtasks: [] as Subtask[] };
  };

  const serializeDescription = (text: string, subtasks: Subtask[]) => {
    return JSON.stringify({ text, subtasks });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    // Save desc and empty subtasks as JSON
    const serializedDesc = serializeDescription(newTaskDesc.trim(), []);

    await addTask({
      user_id: user.id,
      title: newTaskTitle.trim(),
      description: serializedDesc,
      due_date: newTaskDate || null,
      is_completed: false,
      priority: newTaskPriority,
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDate('');
    setNewTaskPriority('medium');
    setIsAddModalOpen(false);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    const parsed = parseDescription(task.description);
    setEditDescText(parsed.text);
    setEditSubtasks(parsed.subtasks);
    setEditPriority(task.priority || 'medium');
    setEditDate(task.due_date ? task.due_date.split('T')[0] : '');
    setNewSubtaskTitle('');
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;

    const serializedDesc = serializeDescription(editDescText.trim(), editSubtasks);

    await updateTask(selectedTask.id, {
      title: editTitle.trim(),
      description: serializedDesc,
      due_date: editDate || null,
      priority: editPriority
    });

    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      is_completed: false
    };
    const updatedSubtasks = [...editSubtasks, newSub];
    setEditSubtasks(updatedSubtasks);
    setNewSubtaskTitle('');

    // Auto-update to DB
    const serializedDesc = serializeDescription(editDescText, updatedSubtasks);
    updateTask(selectedTask.id, { description: serializedDesc });
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedSubtasks = editSubtasks.map(s => 
      s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
    );
    setEditSubtasks(updatedSubtasks);

    // Auto-update to DB
    const serializedDesc = serializeDescription(editDescText, updatedSubtasks);
    updateTask(selectedTask.id, { description: serializedDesc });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedSubtasks = editSubtasks.filter(s => s.id !== subtaskId);
    setEditSubtasks(updatedSubtasks);

    // Auto-update to DB
    const serializedDesc = serializeDescription(editDescText, updatedSubtasks);
    updateTask(selectedTask.id, { description: serializedDesc });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.is_completed;
    if (filter === 'pending') return !task.is_completed;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeights[a.priority as 'low' | 'medium' | 'high'] || 0;
      const weightB = priorityWeights[b.priority as 'low' | 'medium' | 'high'] || 0;
      return weightB - weightA;
    }
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    // Default: date sorting
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'medium':
      default:
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
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
            {t('sidebar.tasks') || 'Görevler'}
          </h1>
          <p className="text-gray-400">
            {tasks.filter(t => !t.is_completed).length} {t('tasks.pendingCount') || 'bekleyen görev var'}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> {t('tasks.newTask') || 'Yeni Görev'}
        </Button>
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            {t('common.all') || 'Tümü'}
          </Button>
          <Button 
            variant={filter === 'pending' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('pending')}
          >
            {t('tasks.pending') || 'Yapılacaklar'}
          </Button>
          <Button 
            variant={filter === 'completed' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('completed')}
          >
            {t('tasks.completed') || 'Tamamlananlar'}
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-2xl p-1.5 text-xs text-gray-400">
          <span className="pl-2 font-medium">Sırala:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-white outline-none border-none pr-4 font-semibold cursor-pointer"
          >
            <option value="date" className="bg-stone-900 text-white">Tarihe Göre</option>
            <option value="priority" className="bg-stone-900 text-white">Önceliğe Göre</option>
            <option value="name" className="bg-stone-900 text-white">Ada Göre</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading && tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading') || 'Yükleniyor...'}</div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-green-900/30 rounded-3xl bg-black/20">
            <p className="text-gray-500">{t('tasks.noTasks') || 'Görev bulunamadı.'}</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const parsedDesc = parseDescription(task.description);
            const totalSubs = parsedDesc.subtasks.length;
            const completedSubs = parsedDesc.subtasks.filter(s => s.is_completed).length;

            return (
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
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-base font-semibold text-white truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h3>
                      {task.priority && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority === 'high' ? 'Yüksek' : task.priority === 'low' ? 'Düşük' : 'Orta'}
                        </span>
                      )}
                    </div>
                    
                    {parsedDesc.text && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 truncate max-w-xl">
                        {parsedDesc.text}
                      </p>
                    )}

                    {/* Subtasks Progress indicator */}
                    {totalSubs > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <ListTodo size={12} className="text-green-400" />
                        <span className="text-[10px] text-gray-400">
                          Alt Görevler: {completedSubs}/{totalSubs}
                        </span>
                        <div className="w-20 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full transition-all duration-300"
                            style={{ width: `${(completedSubs / totalSubs) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {task.due_date && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1.5">
                        <Calendar size={10} />
                        {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(task)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                      title="Düzenle"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-all"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Yeni Görev Modalı */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('tasks.newTask') || 'Yeni Görev'}
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
            label="Açıklama"
            placeholder="Ayrıntılar..."
            value={newTaskDesc}
            onChange={setNewTaskDesc}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Bitiş Tarihi (Opsiyonel)"
              value={newTaskDate}
              onChange={setNewTaskDate}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Öncelik</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none text-sm w-full"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" disabled={!newTaskTitle.trim() || isLoading}>
              {t('common.save') || 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Görev Detay & Düzenleme Modalı */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
        title="Görevi Düzenle"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <Input
            label="Görev Adı"
            placeholder="Ne yapmak istiyorsun?"
            value={editTitle}
            onChange={setEditTitle}
            required
          />
          <Input
            label="Açıklama"
            placeholder="Ayrıntılar..."
            value={editDescText}
            onChange={setEditDescText}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Bitiş Tarihi"
              value={editDate}
              onChange={setEditDate}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Öncelik</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                className="bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none text-sm w-full"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
          </div>

          {/* Alt Görevler (Subtasks) List */}
          <div className="border-t border-green-900/20 pt-4 space-y-3">
            <label className="text-sm font-bold text-white block mb-1">Alt Görevler</label>
            
            {/* Alt Görev Listesi */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {editSubtasks.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-900/30 border border-white/[0.02]">
                  <button 
                    type="button"
                    onClick={() => toggleSubtask(sub.id)}
                    className="flex items-center gap-2 text-xs text-white text-left font-medium min-w-0 flex-1"
                  >
                    {sub.is_completed ? (
                      <CheckSquare size={16} className="text-green-400 shrink-0" />
                    ) : (
                      <Square size={16} className="text-gray-500 shrink-0" />
                    )}
                    <span className={`truncate ${sub.is_completed ? 'line-through text-gray-500' : ''}`}>{sub.title}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Yeni Alt Görev Ekleme Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Alt görev ekle..."
                className="flex-1 bg-black/50 border border-green-900/50 rounded-xl p-2 px-3 text-xs text-white focus:border-green-500 outline-none"
              />
              <Button type="button" size="sm" onClick={handleAddSubtask} className="text-xs">
                Ekle
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => { setIsEditModalOpen(false); setSelectedTask(null); }}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit">
              Güncelle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
