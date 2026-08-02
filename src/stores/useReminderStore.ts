import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reminder_time: string;        // "07:00:00" veya "07:00"
  is_recurring: boolean;
  is_active: boolean;
  days_of_week: number[];       // [0,1,2,3,4,5,6] — 0=Pazar
  sound: string;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  fetchReminders: () => Promise<void>;
  addReminder: (reminder: Partial<Reminder>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,

  fetchReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('reminders')
        .select('*')
        .order('reminder_time', { ascending: true });

      if (error) throw error;
      set({ reminders: data || [] });
    } catch (error: any) {
      console.error('Hatırlatıcılar yüklenemedi:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addReminder: async (reminder) => {
    try {
      const { data, error } = await getSupabase()
        .from('reminders')
        .insert([reminder])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ reminders: [...state.reminders, data].sort((a, b) => a.reminder_time.localeCompare(b.reminder_time)) }));
    } catch (error: any) {
      console.error('Hatırlatıcı eklenemedi:', error.message);
      throw error;
    }
  },

  updateReminder: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        reminders: state.reminders.map(r => r.id === id ? data : r),
      }));
    } catch (error: any) {
      console.error('Hatırlatıcı güncellenemedi:', error.message);
      throw error;
    }
  },

  deleteReminder: async (id) => {
    try {
      const { error } = await getSupabase().from('reminders').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        reminders: state.reminders.filter(r => r.id !== id),
      }));
    } catch (error: any) {
      console.error('Hatırlatıcı silinemedi:', error.message);
      throw error;
    }
  },

  toggleActive: async (id) => {
    const reminder = get().reminders.find(r => r.id === id);
    if (!reminder) return;
    
    try {
      const { data, error } = await getSupabase()
        .from('reminders')
        .update({ is_active: !reminder.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        reminders: state.reminders.map(r => r.id === id ? data : r),
      }));
    } catch (error: any) {
      console.error('Hatırlatıcı durumu değiştirilemedi:', error.message);
      throw error;
    }
  },
}));
