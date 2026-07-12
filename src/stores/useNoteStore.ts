import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

// Lazy singleton — modül yüklendiğinde değil, ilk kullanımda oluşturulur
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  audio_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string, currentPinStatus: boolean) => Promise<void>;
  uploadAudio: (file: File) => Promise<string>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await getSupabase()
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [] });
    } catch (error: any) {
      console.error('Error fetching notes:', error.message);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addNote: async (note) => {
    try {
      const { data, error } = await getSupabase()
        .from('notes')
        .insert([note])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: [data, ...state.notes] }));
      return data;
    } catch (error: any) {
      console.error('Error adding note:', error.message);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? data : n)),
      }));
    } catch (error: any) {
      console.error('Error updating note:', error.message);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      const { error } = await getSupabase().from('notes').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting note:', error.message);
      throw error;
    }
  },

  togglePin: async (id, currentPinStatus) => {
    try {
      // Optimistic update
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, is_pinned: !currentPinStatus } : n
        ),
      }));

      const { error } = await getSupabase()
        .from('notes')
        .update({ is_pinned: !currentPinStatus })
        .eq('id', id);

      if (error) {
        // Rollback
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, is_pinned: currentPinStatus } : n
          ),
        }));
        throw error;
      }
      
      // Resort after pin/unpin
      set((state) => {
        const sorted = [...state.notes].sort((a, b) => {
          if (a.is_pinned === b.is_pinned) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return a.is_pinned ? -1 : 1;
        });
        return { notes: sorted };
      });
      
    } catch (error: any) {
      console.error('Error toggling pin:', error.message);
      throw error;
    }
  },

  uploadAudio: async (file: File) => {
    try {
      const supabase = getSupabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${(await supabase.auth.getUser()).data.user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio_notes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('audio_notes')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading audio:', error.message);
      throw error;
    }
  }
}));
