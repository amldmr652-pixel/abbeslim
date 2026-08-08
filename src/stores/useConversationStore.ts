import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  createConversation: (mode?: 'sources' | 'hybrid' | 'independent', initialTitle?: string) => string;
  deleteConversation: (id: string) => void;
  clearAllHistory: () => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateConversationTitle: (id: string, title: string) => void;
  getActiveConversation: () => Conversation | undefined;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: (mode = 'hybrid', initialTitle = 'Yeni Sohbet') => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newConv: Conversation = {
          id,
          title: initialTitle,
          messages: [
            {
              id: `msg_${Date.now()}`,
              role: 'ai',
              text: 'Merhaba! Ben sizin Life OS asistanınızım. Size nasıl yardımcı olabilirim?',
              timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            }
          ],
          createdAt: now,
          updatedAt: now,
          mode
        };

        set(state => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: id
        }));

        return id;
      },

      deleteConversation: (id) => {
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
      },

      clearAllHistory: () => {
        set({ conversations: [], activeConversationId: null });
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

        set(state => {
          const convs = state.conversations.map(c => {
            if (c.id !== conversationId) return c;

            // İlk kullanıcı mesajından otomatik başlık oluştur (eğer hala default başlıksa)
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
      },

      updateConversationTitle: (id, title) => {
        set(state => ({
          conversations: state.conversations.map(c => c.id === id ? { ...c, title } : c)
        }));
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find(c => c.id === activeConversationId);
      }
    }),
    {
      name: 'lifeos-chat-conversations'
    }
  )
);
