'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useChat } from '@/app/hooks/useChat';
import { ChatMessageList } from './chat/ChatMessageList';
import { ChatInput } from './chat/ChatInput';

interface AIChatWidgetProps {
  currentFileId?: string;
  currentFileUrl?: string;
  isDropdown?: boolean;
}

export default function AIChatWidget({ currentFileId, currentFileUrl, isDropdown = false }: AIChatWidgetProps) {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    mode,
    setMode,
    noteStates,
    messagesEndRef,
    inputRef,
    handleSend,
    clearChat,
    handleSaveAsPDF
  } = useChat(currentFileId);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: isDropdown ? 400 : 400,
        height: isDropdown ? 'calc(100vh - 80px)' : '85vh',
        maxHeight: isDropdown ? 'calc(100vh - 80px)' : 800,
        background: 'rgba(10,12,14,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: isDropdown ? '20px' : '0 20px 20px 0',
        boxShadow: isDropdown
          ? '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.08)'
          : '8px 0 48px rgba(0,0,0,0.7)',
      }}
      onClick={(e) => e.stopPropagation()}
      id="ai-chat-panel"
    >
      {/* Başlık */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'rgba(34,197,94,0.15)' }}
      >
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <span className="text-base">🤖</span>
            AI Asistan
            <span
              className="text-xs px-2 py-0.5 rounded-full font-normal"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
            >
              RAG
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Yüklü PDF&apos;lerinize sorun
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors text-gray-500 hover:text-red-400"
              title="Sohbeti temizle"
              id="ai-chat-clear-btn"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Mod Seçici Tablar */}
      <div
        className="flex items-center justify-around px-2 py-1.5 border-b shrink-0 bg-black/30 gap-1"
        style={{ borderColor: 'rgba(34,197,94,0.1)' }}
      >
        <button
          onClick={() => setMode('sources')}
          className={`flex-1 py-1 text-center rounded-lg text-[11px] font-semibold transition-all ${
            mode === 'sources'
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5'
          }`}
          id="ai-mode-sources"
        >
          📄 Sadece Belge
        </button>
        <button
          onClick={() => setMode('hybrid')}
          className={`flex-1 py-1 text-center rounded-lg text-[11px] font-semibold transition-all ${
            mode === 'hybrid'
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5'
          }`}
          id="ai-mode-hybrid"
        >
          ✨ Hibrit
        </button>
        <button
          onClick={() => setMode('independent')}
          className={`flex-1 py-1 text-center rounded-lg text-[11px] font-semibold transition-all ${
            mode === 'independent'
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5'
          }`}
          id="ai-mode-independent"
        >
          🧠 Genel Bilgi
        </button>
      </div>

      {/* Mesaj Listesi */}
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        currentFileId={currentFileId}
        noteStates={noteStates}
        onSaveAsPDF={handleSaveAsPDF}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Alanı */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        isLoading={isLoading}
        handleSend={handleSend}
        inputRef={inputRef}
      />
    </div>
  );
}
