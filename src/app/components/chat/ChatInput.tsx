import { Send } from 'lucide-react';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  handleSend: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  inputValue,
  setInputValue,
  isLoading,
  handleSend,
  inputRef
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="shrink-0 px-3 pb-3 pt-2 border-t"
      style={{ borderColor: 'rgba(34,197,94,0.1)' }}
    >
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Sorunuzu yazın..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm outline-none placeholder-gray-600 text-gray-100"
          id="ai-chat-input"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="flex items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            width: 32,
            height: 32,
            background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(34,197,94,0.1)',
            flexShrink: 0,
          }}
          id="ai-chat-send-btn"
          title="Gönder"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
