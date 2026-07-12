import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export type PinCategory = 'general' | 'city' | 'sacred' | 'nature' | 'history' | 'food';
export type PinStatus = 'planned' | 'visited';

export interface MapPin {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  category: PinCategory;
  status: PinStatus;
  color: string;
  created_at: string;
}

interface MapState {
  pins: MapPin[];
  isLoading: boolean;
  fetchPins: () => Promise<void>;
  addPin: (pin: Partial<MapPin>) => Promise<void>;
  updatePin: (id: string, updates: Partial<MapPin>) => Promise<void>;
  removePin: (id: string) => Promise<void>;
}

export const useMapStore = create<MapState>((set) => ({
  pins: [],
  isLoading: false,

  fetchPins: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ pins: data || [] });
    } catch (e: any) {
      console.error('Harita pinleri alınamadı:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  addPin: async (pin) => {
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .insert([pin])
        .select()
        .single();
      if (error) throw error;
      set((s) => ({ pins: [data, ...s.pins] }));
    } catch (e: any) {
      console.error('Pin eklenemedi:', e.message);
    }
  },

  updatePin: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      set((s) => ({ pins: s.pins.map((p) => (p.id === id ? data : p)) }));
    } catch (e: any) {
      console.error('Pin güncellenemedi:', e.message);
    }
  },

  removePin: async (id) => {
    try {
      const { error } = await getSupabase().from('map_pins').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ pins: s.pins.filter((p) => p.id !== id) }));
    } catch (e: any) {
      console.error('Pin silinemedi:', e.message);
    }
  },
}));
