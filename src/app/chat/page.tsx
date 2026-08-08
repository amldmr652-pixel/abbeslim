'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, MessageSquare, Bot, Sparkles, FileText, Brain, Send, Loader2 } from 'lucide-react';
import { useConversationStore } from '@/stores/useConversationStore';
import { ChatMessageList } from '@/app/components/chat/ChatMessageList';
import { ChatInput } from '@/app/components/chat/ChatInput';

export default function ChatPage() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    setActiveConversation,
    addMessage,
    getActiveConversation
  } = useConversationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [noteStates, setNoteStates] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Eğer hiç conversation yoksa otomatik bir tane oluştur
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation('hybrid');
    } else if (!activeConversationId) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations, activeConversationId, createConversation, setActiveConversation]);

  const activeConv = getActiveConversation() || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading || !activeConv) return;

    const convId = activeConv.id;
    setInputValue('');

    // 1. Kullanıcı mesajını store'a ekle
    addMessage(convId, {
      role: 'user',
      text
    });

    setIsLoading(true);

    try {
      // 2. API'ye gönder
      const history = activeConv.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          mode: activeConv.mode || 'hybrid',
          history
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI yanıt veremedi');

      // 3. AI eylemlerini çalıştır (örn. tema değişimi)
      if (data.actions && Array.isArray(data.actions)) {
        data.actions.forEach((act: any) => {
          if (act.type === 'update_settings' && act.setting_type === 'theme') {
            const { useSettingsStore } = require('@/stores/useSettingsStore');
            useSettingsStore.getState().setTheme(act.value);
          }
        });
      }

      // 4. AI yanıtını store'a ekle
      addMessage(convId, {
        role: 'ai',
        text: data.answer || 'Yanıt alınamadı.',
        sources: data.sources || [],
        actions: data.actions || []
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      addMessage(convId, {
        role: 'ai',
        text: `⚠️ Hata oluştu: ${error.message || 'Yanıt alınamadı.'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (text: string, msgId: string) => {
    setNoteStates(prev => ({ ...prev, [msgId]: 'saving' }));
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `AI Notu (${new Date().toLocaleDateString('tr-TR')})`,
          content: text
        })
      });
      if (!res.ok) throw new Error('Not kaydedilemedi');
      setNoteStates(prev => ({ ...prev, [msgId]: 'saved' }));
      setTimeout(() => {
        setNoteStates(prev => ({ ...prev, [msgId]: 'idle' }));
      }, 3000);
    } catch (err) {
      console.error(err);
      setNoteStates(prev => ({ ...prev, [msgId]: 'idle' }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 md:p-6 gap-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Sol Panel: Sohbet Geçmişi */}
      <div className="w-full md:w-80 glass rounded-3xl p-4 flex flex-col shrink-0 border border-green-900/30">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bot className="text-green-400" size={22} />
            <h2 className="font-bold text-white text-lg">AI Sohbetler</h2>
          </div>
          <button
            onClick={() => createConversation('hybrid')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105"
          >
            <Plus size={14} /> Yeni Sohbet
          </button>
        </div>

        {/* Sohbet Listesi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Henüz sohbet geçmişi yok.</p>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === activeConv?.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-green-600/15 border-green-500/40 text-white shadow-md'
                      : 'hover:bg-white/5 border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-6">
                    <MessageSquare size={16} className={isActive ? 'text-green-400' : 'text-gray-500'} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(conv.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Bu sohbeti silmek istediğinize emin misiniz?')) {
                        deleteConversation(conv.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all text-gray-500"
                    title="Sohbeti Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sağ Panel: Aktif Chat Odası */}
      <div className="flex-1 glass rounded-3xl flex flex-col overflow-hidden border border-green-900/30">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/30">
          <div>
            <h3 className="font-bold text-white text-base truncate">
              {activeConv?.title || 'Yapay Zeka Asistanı'}
            </h3>
            <p className="text-xs text-gray-400">Gemini Pro • Kişisel Life OS Asistanı</p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            {[
              { id: 'sources', icon: <FileText size={12} />, label: 'Belge' },
              { id: 'hybrid', icon: <Sparkles size={12} />, label: 'Hibrit' },
              { id: 'independent', icon: <Brain size={12} />, label: 'Genel' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  if (activeConv) {
                    useConversationStore.setState(state => ({
                      conversations: state.conversations.map(c => c.id === activeConv.id ? { ...c, mode: m.id as any } : c)
                    }));
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  (activeConv?.mode || 'hybrid') === m.id
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          <ChatMessageList
            messages={(activeConv?.messages || []).map(m => ({
              id: m.id,
              role: m.role || 'ai',
              text: m.text,
              sources: m.sources,
            }))}
            isLoading={isLoading}
            noteStates={noteStates}
            onSaveAsPDF={(msgId, q, a, title) => handleCreateNote(a, msgId)}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSend={handleSend}
            isLoading={isLoading}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}
