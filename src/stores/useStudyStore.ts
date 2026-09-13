import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface PomodoroSession {
  duration_minutes: number;
  created_at: string;
}

interface StudyState {
  sessions: PomodoroSession[];
  isLoading: boolean;
  error: string | null;
  _lastFetched: number | null;
  fetchSessions: (uid: string, force?: boolean) => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,
  _lastFetched: null,

  fetchSessions: async (uid: string, force = false) => {
    if (!uid) return;
    const state = get();
    // 30 saniye TTL onbellek: Bellekte veri varsa aninda don (0ms)
    if (!force && state.sessions.length > 0 && state._lastFetched && Date.now() - state._lastFetched < 30000) {
      return;
    }

    if (state.sessions.length === 0) {
      set({ isLoading: true, error: null });
    }

    try {
      const { data, error } = await getSupabase()
        .from('pomodoro_sessions')
        .select('duration_minutes, created_at')
        .eq('user_id', uid)
        .eq('mode', 'pomodoro')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ sessions: data || [], _lastFetched: Date.now(), isLoading: false });
    } catch (err: any) {
      console.error('Pomodoro seanslari cekilemedi:', err.message);
      set({ error: err.message, isLoading: false });
    }
  },
}));
