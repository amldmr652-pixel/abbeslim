'use client';

import { useState, useEffect } from 'react';
import { Trash2, GripHorizontal, RotateCcw, Move } from 'lucide-react';
import { useChat } from '@/app/hooks/useChat';
import { useDragResize } from '@/app/hooks/useDragResize';
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

  const {
    geometry,
    isDragging,
    isResizing,
    dragHandleProps,
    resizeHandleProps,
    resetGeometry
  } = useDragResize({
    minWidth: 360,
    minHeight: 420,
    defaultWidth: 420,
    defaultHeight: 650,
  });

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

  const containerStyle: React.CSSProperties = isDropdown
    ? {
        position: 'fixed',
        left: `${geometry.x}px`,
        top: `${geometry.y}px`,
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
        maxHeight: '92vh',
        maxWidth: '92vw',
        background: 'rgba(10,12,14,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.12)',
        zIndex: 9998,
        userSelect: isDragging || isResizing ? 'none' : 'auto',
      }
    : {
        width: '100%',
        maxWidth: 400,
        height: '85vh',
        maxHeight: 800,
        background: 'rgba(10,12,14,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '0 20px 20px 0',
        boxShadow: '8px 0 48px rgba(0,0,0,0.7)',
      };

  return (
    <div
      className="flex flex-col overflow-hidden pb-2 md:pb-0 relative group select-none"
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
      id="ai-chat-panel"
    >
      {/* Başlık (Sürükleme Alanı) */}
      <div
        {...(isDropdown ? dragHandleProps : {})}
        className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          isDropdown ? 'cursor-grab active:cursor-grabbing hover:bg-white/[0.02] transition-colors' : ''
        }`}
        style={{ borderColor: 'rgba(34,197,94,0.15)' }}
        title={isDropdown ? 'Paneli taşımak için sürükleyin' : undefined}
      >
        <div className="flex items-center gap-2">
          {isDropdown && (
            <Move size={14} className="text-green-500/70 opacity-60 group-hover:opacity-100 transition-opacity" />
          )}
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
              Yüklü PDF&apos;lerinize veya görevlerinize sorun
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isDropdown && (
            <button
              onClick={resetGeometry}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              title="Konum ve boyutu sıfırla"
              id="ai-chat-reset-geo-btn"
            >
              <RotateCcw size={14} />
            </button>
          )}

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

      {/* Sağ Alt Köşe Resize Grip (Sadece Dropdown Modunda) */}
      {isDropdown && (
        <div
          {...resizeHandleProps}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center text-gray-500 hover:text-green-400 transition-colors z-10"
          title="Boyutlandırmak için sürükleyin"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1L1 9M9 5L5 9M9 9H9.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

