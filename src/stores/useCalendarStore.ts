import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { syncReminderForCalendarEvent, deleteLinkedReminder } from '@/lib/reminderSync';

// Lazy singleton — modül yüklendiğinde değil, ilk kullanımda oluşturulur
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      set({ events: data || [] });
    } catch (error: any) {
      console.error('Error fetching calendar events:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addEvent: async (event) => {
    try {
      const { data, error } = await getSupabase()
        .from('calendar_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ events: [...state.events, data] }));
      
      // Otomatik hatırlatıcı senkronizasyonu
      syncReminderForCalendarEvent(data);
    } catch (error: any) {
      console.error('Error adding calendar event:', error.message);
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? data : e)),
      }));

      // Otomatik hatırlatıcı senkronizasyonu
      syncReminderForCalendarEvent(data);
    } catch (error: any) {
      console.error('Error updating calendar event:', error.message);
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      const { error } = await getSupabase().from('calendar_events').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));

      // Otomatik hatırlatıcı silme
      deleteLinkedReminder('calendar', id);
    } catch (error: any) {
      console.error('Error deleting calendar event:', error.message);
      throw error;
    }
  },
}));
