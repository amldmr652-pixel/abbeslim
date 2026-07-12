import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export type MediaType = 'movie' | 'series' | 'book';
export type MediaStatus = 'planned' | 'active' | 'completed';

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  media_type: MediaType;
  status: MediaStatus;
  rating: number;
  poster_url: string | null;
  tmdb_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TrackerState {
  items: MediaItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Partial<MediaItem>) => Promise<void>;
  updateItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('media_tracker')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ items: data || [] });
    } catch (error: any) {
      console.error('Error fetching media items:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    try {
      const { data, error } = await getSupabase()
        .from('media_tracker')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ items: [data, ...state.items] }));
    } catch (error: any) {
      console.error('Error adding media item:', error.message);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('media_tracker')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? data : i)),
      }));
    } catch (error: any) {
      console.error('Error updating media item:', error.message);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      const { error } = await getSupabase().from('media_tracker').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting media item:', error.message);
      throw error;
    }
  },
}));
