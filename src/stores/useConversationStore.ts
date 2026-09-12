import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: any[];
  actions?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  mode: 'sources' | 'hybrid' | 'independent';
}

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  createConversation: (mode?: 'sources' | 'hybrid' | 'independent', initialTitle?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateConversationTitle: (id: string, title: string) => void;
  getActiveConversation: () => Conversation | undefined;
}

// Supabase row → Conversation dönüştürme
function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mode: row.mode || 'hybrid',
  };
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Chat geçmişi yüklenemedi:', error.message);
        set({ isLoading: false });
        return;
      }

      const convs = (data || []).map(rowToConversation);
      set({
        conversations: convs,
        activeConversationId: convs.length > 0 ? convs[0].id : null,
        isLoading: false,
      });
    } catch (err) {
      console.error('fetchConversations hata:', err);
      set({ isLoading: false });
    }
  },

  createConversation: async (mode = 'hybrid', initialTitle = 'Yeni Sohbet') => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'ai',
      text: 'Merhaba! Ben sizin Life OS asistanınızım. Size nasıl yardımcı olabilirim?',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    const newConv: Conversation = {
      id,
      title: initialTitle,
      messages: [welcomeMsg],
      createdAt: now,
      updatedAt: now,
      mode
    };

    // Optimistic update — anında UI'da göster
    set(state => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: id
    }));

    // Supabase'e kaydet — INSERT tamamlanmadan addMessage çağrılmamalı
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('chat_conversations').insert({
          id,
          user_id: user.id,
          title: initialTitle,
          mode,
          messages: [welcomeMsg],
          created_at: now,
          updated_at: now,
        });
        if (error) {
          console.error('Supabase INSERT hatası:', error.message, error.details);
        }
      }
    } catch (err) {
      console.error('Sohbet oluşturma Supabase hatası:', err);
    }

    return id;
  },

  deleteConversation: async (id) => {
    // Optimistic update
    set(state => {
      const filtered = state.conversations.filter(c => c.id !== id);
      const newActive = state.activeConversationId === id
        ? (filtered.length > 0 ? filtered[0].id : null)
        : state.activeConversationId;
      return {
        conversations: filtered,
        activeConversationId: newActive
      };
    });

    // Supabase'den sil
    try {
      const supabase = createClient();
      await supabase.from('chat_conversations').delete().eq('id', id);
    } catch (err) {
      console.error('Sohbet silme hatası:', err);
    }
  },

  clearAllHistory: async () => {
    const oldConvs = get().conversations;
    set({ conversations: [], activeConversationId: null });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('chat_conversations').delete().eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Geçmiş temizleme hatası:', err);
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  addMessage: (conversationId, msgData) => {
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();
    const fullMsg: ChatMessage = {
      ...msgData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: nowStr
    };

    // Optimistic update
    set(state => {
      const convs = state.conversations.map(c => {
        if (c.id !== conversationId) return c;
        let newTitle = c.title;
        if (c.title === 'Yeni Sohbet' && msgData.role === 'user') {
          newTitle = msgData.text.slice(0, 30) + (msgData.text.length > 30 ? '...' : '');
        }
        return {
          ...c,
          title: newTitle,
          messages: [...c.messages, fullMsg],
          updatedAt: nowIso
        };
      });
      return { conversations: convs };
    });

    // Supabase'e kaydet (arka planda) — upsert ile race condition önlenir
    setTimeout(async () => {
      try {
        const conv = get().conversations.find(c => c.id === conversationId);
        if (!conv) return;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('chat_conversations').upsert({
          id: conversationId,
          user_id: user.id,
          title: conv.title,
          mode: conv.mode,
          messages: conv.messages,
          updated_at: nowIso,
        });
        if (error) {
          console.error('Mesaj kaydetme Supabase hatası:', error.message, error.details);
        }
      } catch (err) {
        console.error('Mesaj kaydetme hatası:', err);
      }
    }, 500);
  },

  updateConversationTitle: (id, title) => {
    set(state => ({
      conversations: state.conversations.map(c => c.id === id ? { ...c, title } : c)
    }));

    // Supabase güncelle
    const supabase = createClient();
    supabase.from('chat_conversations').update({ title }).eq('id', id).then();
  },

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find(c => c.id === activeConversationId);
  }
}));
