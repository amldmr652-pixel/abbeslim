import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  progress: number;
  color: string;
  created_at: string;
  updated_at: string;
}

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ goals: data || [] });
    } catch (error: any) {
      console.error('Error fetching goals:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: async (goal) => {
    try {
      const { data, error } = await getSupabase()
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ goals: [data, ...state.goals] }));
    } catch (error: any) {
      console.error('Error adding goal:', error.message);
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? data : g)),
      }));
    } catch (error: any) {
      console.error('Error updating goal:', error.message);
      throw error;
    }
  },

  deleteGoal: async (id) => {
    try {
      const { error } = await getSupabase().from('goals').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting goal:', error.message);
      throw error;
    }
  },
}));
