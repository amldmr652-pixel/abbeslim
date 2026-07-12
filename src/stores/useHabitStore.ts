import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  color: string;
  last_completed: string | null;
  created_at: string;
  updated_at: string;
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkInHabit: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ habits: data || [] });
    } catch (error: any) {
      console.error('Error fetching habits:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addHabit: async (habit) => {
    try {
      const { data, error } = await getSupabase()
        .from('habits')
        .insert([habit])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ habits: [data, ...state.habits] }));
    } catch (error: any) {
      console.error('Error adding habit:', error.message);
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? data : h)),
      }));
    } catch (error: any) {
      console.error('Error updating habit:', error.message);
      throw error;
    }
  },

  deleteHabit: async (id) => {
    try {
      const { error } = await getSupabase().from('habits').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting habit:', error.message);
      throw error;
    }
  },

  checkInHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    // Check if already completed today
    if (habit.last_completed) {
      const lastDate = new Date(habit.last_completed).toDateString();
      const today = new Date().toDateString();
      if (lastDate === today) return; // Already checked in today
    }

    const newStreak = habit.streak + 1;
    const now = new Date().toISOString();

    try {
      const { data, error } = await getSupabase()
        .from('habits')
        .update({ streak: newStreak, last_completed: now })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? data : h)),
      }));
    } catch (error: any) {
      console.error('Error checking in habit:', error.message);
      throw error;
    }
  },
}));
