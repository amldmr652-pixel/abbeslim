import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
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
            console.warn('Supabase chat geçmişi okunamadı:', error.message);
            set({ isLoading: false });
            return;
          }

          const remoteConvs: Conversation[] = (data || []).map(rowToConversation);
          const localConvs: Conversation[] = get().conversations || [];

          // Local ve Supabase konuşmalarını birleştir (id bazlı)
          const convMap = new Map<string, Conversation>();
          
          // Önce uzak konuşmaları haritaya ekle
          remoteConvs.forEach((c: Conversation) => convMap.set(c.id, c));
          
          // Yerel konuşmaları birleştir — uzakta olmayanları tespit et ve senkronize et
          localConvs.forEach((localC: Conversation) => {
            const remoteC = convMap.get(localC.id);
            if (!remoteC) {
              convMap.set(localC.id, localC);
              // Supabase'de henüz yoksa arka planda kaydet
              supabase.from('chat_conversations').upsert({
                id: localC.id,
                user_id: user.id,
                title: localC.title,
                mode: localC.mode,
                messages: localC.messages,
                created_at: localC.createdAt,
                updated_at: localC.updatedAt,
              }).then();
            } else {
              // Eğer yereldeki konuşmada daha çok mesaj varsa (son konuşma), yereli koru
              if ((localC.messages?.length || 0) > (remoteC.messages?.length || 0)) {
                convMap.set(localC.id, localC);
                // Uzaktakini güncelle
                supabase.from('chat_conversations').upsert({
                  id: localC.id,
                  user_id: user.id,
                  title: localC.title,
                  mode: localC.mode,
                  messages: localC.messages,
                  updated_at: localC.updatedAt,
                }).then();
              }
            }
          });

          const merged = Array.from(convMap.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          set({
            conversations: merged,
            activeConversationId: get().activeConversationId || (merged.length > 0 ? merged[0].id : null),
            isLoading: false,
          });
        } catch (err) {
          console.warn('fetchConversations hata:', err);
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

        // Optimistic update — hem bellekte hem localStorage'da anında var
        set(state => ({
          conversations: [newConv, ...(state.conversations || [])],
          activeConversationId: id
        }));

        // Supabase'e arka planda kaydet
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase.from('chat_conversations').upsert({
              id,
              user_id: user.id,
              title: initialTitle,
              mode,
              messages: [welcomeMsg],
              created_at: now,
              updated_at: now,
            });
            if (error) {
              console.warn('Supabase INSERT hatası:', error.message);
            }
          }
        } catch (err) {
          console.warn('Sohbet oluşturma Supabase hatası:', err);
        }

        return id;
      },

      deleteConversation: async (id) => {
        set(state => {
          const filtered = (state.conversations || []).filter(c => c.id !== id);
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
          console.warn('Sohbet silme hatası:', err);
        }
      },

      clearAllHistory: async () => {
        set({ conversations: [], activeConversationId: null });

        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('chat_conversations').delete().eq('user_id', user.id);
          }
        } catch (err) {
          console.warn('Geçmiş temizleme hatası:', err);
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

        // 1. ANINDA GÜNCELLE (0ms) — UI ve localStorage anında güncellenir
        set(state => {
          const convs = (state.conversations || []).map(c => {
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

        // 2. Supabase'e arka planda kaydet (upsert ile kesintisiz)
        setTimeout(async () => {
          try {
            const conv = (get().conversations || []).find(c => c.id === conversationId);
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
              console.warn('Mesaj kaydetme Supabase hatası:', error.message);
            }
          } catch (err) {
            console.warn('Mesaj kaydetme hatası:', err);
          }
        }, 100);
      },

      updateConversationTitle: (id, title) => {
        set(state => ({
          conversations: (state.conversations || []).map(c => c.id === id ? { ...c, title } : c)
        }));

        const supabase = createClient();
        supabase.from('chat_conversations').update({ title }).eq('id', id).then();
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        if (!conversations || conversations.length === 0) return undefined;
        return conversations.find(c => c.id === activeConversationId) || conversations[0];
      }
    }),
    {
      name: 'lifeos-chat-conversations',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId
      }),
    }
  )
);
