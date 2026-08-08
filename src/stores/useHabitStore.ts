import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { syncReminderForHabit, deleteLinkedReminder } from '@/lib/reminderSync';

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
  scheduled_time: string | null;  // "08:30" formatı
  description: string;
  sort_order: number;
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
  uncheckHabit: (id: string) => Promise<void>;
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
        .order('scheduled_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const todayStr = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Check and reset expired streaks
      const updatedHabits = await Promise.all((data || []).map(async (habit: Habit) => {
        if (!habit.last_completed) return habit;

        const lastCompletedDate = new Date(habit.last_completed);
        const lastCompletedStr = lastCompletedDate.toDateString();

        if (habit.frequency === 'daily') {
          // If last completed is not today and not yesterday, reset streak to 0
          if (lastCompletedStr !== todayStr && lastCompletedStr !== yesterdayStr) {
            if (habit.streak > 0) {
              try {
                const { data: updated } = await getSupabase()
                  .from('habits')
                  .update({ streak: 0 })
                  .eq('id', habit.id)
                  .select()
                  .single();
                if (updated) return updated;
              } catch (err) {
                console.error('Failed to auto-reset streak for habit:', habit.id, err);
              }
              return { ...habit, streak: 0 };
            }
          }
        } else if (habit.frequency === 'weekly') {
          // If last completed was more than 14 days ago, reset streak
          const diffTime = Date.now() - lastCompletedDate.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          if (diffDays > 14) {
            if (habit.streak > 0) {
              try {
                const { data: updated } = await getSupabase()
                  .from('habits')
                  .update({ streak: 0 })
                  .eq('id', habit.id)
                  .select()
                  .single();
                if (updated) return updated;
              } catch (err) {
                console.error('Failed to auto-reset weekly streak for habit:', habit.id, err);
              }
              return { ...habit, streak: 0 };
            }
          }
        }
        return habit;
      }));

      set({ habits: updatedHabits });
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

      // Hatırlatıcı senkronizasyonu
      syncReminderForHabit(data);
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

      // Hatırlatıcı senkronizasyonu
      syncReminderForHabit(data);
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

      // Hatırlatıcı silme
      deleteLinkedReminder('habit', id);
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

  uncheckHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    // Sadece bugün check-in yapılmışsa geri al
    if (habit.last_completed) {
      const lastDate = new Date(habit.last_completed).toDateString();
      const today = new Date().toDateString();
      if (lastDate !== today) return; // Bugün yapılmamışsa geri alma
    } else {
      return; // Zaten check-in yapılmamış
    }

    const newStreak = Math.max(0, habit.streak - 1);

    try {
      const { data, error } = await getSupabase()
        .from('habits')
        .update({ streak: newStreak, last_completed: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? data : h)),
      }));
    } catch (error: any) {
      console.error('Error unchecking habit:', error.message);
      throw error;
    }
  },
}));
