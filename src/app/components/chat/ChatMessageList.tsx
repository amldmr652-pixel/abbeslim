import { MessageCircle, FileText, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Message, Source } from '@/app/hooks/useChat';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentFileId?: string;
  noteStates: { [msgId: string]: 'idle' | 'saving' | 'saved' };
  onSaveAsPDF: (msgId: string, question: string, answer: string, title?: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const renderMessageText = (text: string, sources?: Source[]) => {
  if (!sources || sources.length === 0) return text;
  
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const source = sources[num - 1];
      if (source) {
        return (
          <button
            key={index}
            onClick={() => {
              const viewerUrl = `/viewer?url=${encodeURIComponent(source.url)}&page=${source.page}${source.fileId ? '&fileId=' + source.fileId : ''}`;
              window.open(viewerUrl, '_blank');
            }}
            className="inline-flex items-center justify-center mx-0.5 px-1 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all hover:bg-green-600 hover:text-white align-super"
            style={{
              background: 'rgba(34,197,94,0.2)',
              color: '#4ade80',
              border: '1px solid rgba(34,197,94,0.3)',
              lineHeight: 1,
            }}
            title={`${source.fileName} - Sayfa ${source.page}`}
          >
            {num}
          </button>
        );
      }
    }
    return part;
  });
};

export function ChatMessageList({
  messages,
  isLoading,
  currentFileId,
  noteStates,
  onSaveAsPDF,
  messagesEndRef
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,197,94,0.2) transparent' }}>
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            <MessageCircle size={28} style={{ color: '#4ade80' }} />
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Notlarınız hakkında soru sorun!
          </div>
          <div className="text-xs" style={{ color: '#4b5563' }}>
            {currentFileId ? 'Bu PDF üzerine veya tüm dosyalarınız hakkında' : 'Tüm yüklü dosyalarınız taranır'}
          </div>
        </div>
      )}

      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className="px-3 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[88%]"
            style={
              msg.role === 'user'
                ? {
                    background: 'rgba(22,163,74,0.25)',
                    color: '#f0fdf4',
                    borderRadius: '18px 18px 4px 18px',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }
                : {
                    background: 'rgba(17,24,39,0.9)',
                    color: '#e5e7eb',
                    borderRadius: '18px 18px 18px 4px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }
            }
          >
            {renderMessageText(msg.text, msg.sources)}
          </div>

          {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-[90%]">
              {msg.sources.slice(0, 5).map((src, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const viewerUrl = `/viewer?url=${encodeURIComponent(src.url)}&page=${src.page}${src.fileId ? '&fileId=' + src.fileId : ''}`;
                    window.open(viewerUrl, '_blank');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    color: '#86efac',
                  }}
                  title={`${src.fileName} - Sayfa ${src.page}`}
                >
                  <FileText size={11} />
                  <span className="truncate max-w-[120px]">{src.fileName}</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>· {src.page}</span>
                </button>
              ))}
            </div>
          )}

          {msg.role === 'ai' && msg.hasConflict && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs max-w-[90%]"
              style={{
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.25)',
                color: '#fde68a',
              }}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              ⚠️ Farklı kaynaklarda çelişen bilgiler tespit edildi
            </div>
          )}

          {msg.role === 'ai' && msg.calendarEvent && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs max-w-[90%] font-medium transition-all"
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#4ade80',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check size={14} className="shrink-0 text-green-400 stroke-[3]" />
              <span>
                📅 Takvime Eklendi: {msg.calendarEvent.title} - {msg.calendarEvent.date}{msg.calendarEvent.time ? ` ${msg.calendarEvent.time}` : ''}
              </span>
            </div>
          )}

          {msg.role === 'ai' && msg.financeTransaction && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs max-w-[90%] font-medium transition-all"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check size={14} className="shrink-0 text-emerald-400 stroke-[3]" />
              <span>
                💰 Finans İşlemi Eklendi: {msg.financeTransaction.amount} ₺ - {msg.financeTransaction.category}
              </span>
            </div>
          )}

          {msg.role === 'ai' && msg.task && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs max-w-[90%] font-medium transition-all"
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check size={14} className="shrink-0 text-blue-400 stroke-[3]" />
              <span>
                ✅ Görev Oluşturuldu: {msg.task.title}
              </span>
            </div>
          )}

          {msg.role === 'ai' && msg.note && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs max-w-[90%] font-medium transition-all"
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check size={14} className="shrink-0 text-purple-400 stroke-[3]" />
              <span>
                📝 Not Kaydedildi: {msg.note.title}
              </span>
            </div>
          )}

          {msg.role === 'ai' && msg.goal && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs max-w-[90%] font-medium transition-all"
              style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                color: '#facc15',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check size={14} className="shrink-0 text-yellow-400 stroke-[3]" />
              <span>
                🎯 {msg.goal.type === 'habit' ? 'Alışkanlık' : 'Hedef'} Eklendi: {msg.goal.title}
              </span>
            </div>
          )}

          {msg.role === 'ai' && (
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  const msgIndex = messages.findIndex(m => m.id === msg.id);
                  const questionMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
                  const questionText = questionMsg ? questionMsg.text : 'AI Çalışma Notu';
                  onSaveAsPDF(msg.id, questionText, msg.text, msg.title);
                }}
                disabled={noteStates[msg.id] === 'saving' || noteStates[msg.id] === 'saved'}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:bg-green-600/30 border border-green-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: noteStates[msg.id] === 'saved' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.05)',
                  borderColor: noteStates[msg.id] === 'saved' ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.2)',
                  color: noteStates[msg.id] === 'saved' ? '#4ade80' : '#86efac',
                  cursor: noteStates[msg.id] === 'saved' ? 'default' : 'pointer',
                }}
              >
                {noteStates[msg.id] === 'saving' ? (
                  <>
                    <Loader2 size={11} className="animate-spin text-green-400" />
                    <span>Not Kaydediliyor...</span>
                  </>
                ) : noteStates[msg.id] === 'saved' ? (
                  <>
                    <Check size={11} className="text-green-400" />
                    <span>Kütüphaneme Kaydedildi ✓</span>
                  </>
                ) : (
                  <>
                    <FileText size={11} />
                    <span>Çalışma Notu Olarak Kaydet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-start">
          <div
            className="px-4 py-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(17,24,39,0.9)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '18px 18px 18px 4px',
              color: '#6b7280',
            }}
          >
            <span className="animate-pulse">••• AI düşünüyor...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
