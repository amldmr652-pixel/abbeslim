import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { syncReminderForTask, deleteLinkedReminder } from '@/lib/reminderSync';

// Lazy singleton — modül yüklendiğinde değil, ilk kullanımda oluşturulur
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  _lastFetched: number | null;
  fetchTasks: (force?: boolean) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string, currentStatus: boolean) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  _lastFetched: null,

  fetchTasks: async (force = false) => {
    const state = get();
    if (!force && state.tasks.length > 0 && state._lastFetched && Date.now() - state._lastFetched < 30000) {
      return;
    }
    if (state.tasks.length === 0) {
      set({ isLoading: true, error: null });
    }
    try {
      const { data, error } = await getSupabase()
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: data || [], _lastFetched: Date.now() });
    } catch (error: any) {
      console.error('Error fetching tasks:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      const { data, error } = await getSupabase()
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ tasks: [data, ...state.tasks] }));
      // Otomatik hatırlatıcı senkronizasyonu
      try { await syncReminderForTask(data); } catch (e) { console.warn(e); }
    } catch (error: any) {
      console.error('Error adding task:', error.message);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? data : t)),
      }));
      // Otomatik hatırlatıcı senkronizasyonu
      try { await syncReminderForTask(data); } catch (e) { console.warn(e); }
    } catch (error: any) {
      console.error('Error updating task:', error.message);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await getSupabase().from('tasks').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      // Bağlı hatırlatıcıyı sil
      try { await deleteLinkedReminder('task', id); } catch (e) { console.warn(e); }
    } catch (error: any) {
      console.error('Error deleting task:', error.message);
      throw error;
    }
  },

  toggleTaskCompletion: async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      // Optimistic update
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, is_completed: newStatus } : t
        ),
      }));

      const { error } = await getSupabase()
        .from('tasks')
        .update({ is_completed: newStatus })
        .eq('id', id);

      if (error) {
        // Rollback on error
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, is_completed: currentStatus } : t
          ),
        }));
        throw error;
      }
      // Görev durumu değiştiğinde hatırlatıcıyı güncelle
      const updatedTask = get().tasks.find(t => t.id === id);
      if (updatedTask) {
        try { await syncReminderForTask(updatedTask); } catch (e) { console.warn(e); }
      }
    } catch (error: any) {
      console.error('Error toggling task:', error.message);
      throw error;
    }
  },
}));
