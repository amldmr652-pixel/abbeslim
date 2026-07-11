'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, AlertTriangle, FileText, Check, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Source {
  fileName: string;
  page: string | number;
  fileId: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  title?: string;
  sources?: Source[];
  hasConflict?: boolean;
}

const renderMessageText = (text: string, sources?: Source[]) => {
  if (!sources || sources.length === 0) return text;
  
  // split by [1], [2], etc.
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
              const viewerUrl = `/viewer?url=${encodeURIComponent(source.url)}&page=${source.page}${source.fileId ? `&fileId=${source.fileId}` : ''}`;
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

interface AIChatWidgetProps {
  currentFileId?: string;
  currentFileUrl?: string;
}

export default function AIChatWidget({ currentFileId, currentFileUrl }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'sources' | 'independent' | 'hybrid'>('hybrid');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [noteStates, setNoteStates] = useState<{ [msgId: string]: 'idle' | 'saving' | 'saved' }>({});

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleSaveAsPDF = async (msgId: string, question: string, answer: string, title: string = 'Calisma_Notu') => {
    setNoteStates(prev => ({ ...prev, [msgId]: 'saving' }));
    
    try {
      // 1. Türkçe karakter desteği için yerel Roboto fontlarını çek
      const [resRegular, resBold] = await Promise.all([
        fetch('/fonts/Roboto-Regular.ttf'),
        fetch('/fonts/Roboto-Medium.ttf')
      ]);

      if (!resRegular.ok || !resBold.ok) {
        throw new Error('Font yükleme hatası. Sunucuyla bağlantı kurulamadı.');
      }

      const [bufferRegular, bufferBold] = await Promise.all([
        resRegular.arrayBuffer(),
        resBold.arrayBuffer()
      ]);

      const base64Regular = arrayBufferToBase64(bufferRegular);
      const base64Bold = arrayBufferToBase64(bufferBold);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Fontları VFS'e ekle
      doc.addFileToVFS('Roboto-Regular.ttf', base64Regular);
      doc.addFileToVFS('Roboto-Medium.ttf', base64Bold);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      
      let y = 20;

      // Header
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(22, 163, 74); // green-600
      doc.text('abbeslim Çalışma Notu', margin, y);
      
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      
      // Date
      y += 10;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, margin, y);
      
      // Question Header
      y += 10;
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text('SORU:', margin, y);
      
      // Question Text
      y += 6;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const splitQuestion = doc.splitTextToSize(question, contentWidth);
      doc.text(splitQuestion, margin, y);
      y += splitQuestion.length * 5 + 5;
      
      // Line separator
      doc.line(margin, y, pageWidth - margin, y);
      
      // Answer Header
      y += 10;
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(22, 163, 74);
      doc.text('AI YANITI / ÖZET:', margin, y);
      
      // Answer Text
      y += 6;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      
      const cleanAnswer = answer.replace(/\*\*/g, '').replace(/\*/g, ''); // Markdown sembollerini temizle
      const splitAnswer = doc.splitTextToSize(cleanAnswer, contentWidth);
      
      const lineHeight = 6;
      for (let i = 0; i < splitAnswer.length; i++) {
        if (y > pageHeight - margin) {
          doc.addPage();
          // Yeni sayfada font ayarlarını tekrar tanımla (jsPDF sıfırlar)
          doc.setFont('Roboto', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(40, 40, 40);
          y = margin;
        }
        doc.text(splitAnswer[i], margin, y);
        y += lineHeight;
      }

      const pdfBlob = doc.output('blob');
      
      const fileName = `${title}_Calisma_Notu.pdf`;
      
      let catId = '';
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        const categoriesList = catData.categories || [];
        
        // "Notlarım" kategorisini ara (büyük/küçük harf duyarsız)
        const existingCat = categoriesList.find(
          (c: any) => c.name.toLowerCase() === 'notlarım' || c.name.toLowerCase() === 'notlarim'
        );
        
        if (existingCat) {
          catId = existingCat.id;
        } else {
          // "Notlarım" kategorisi yoksa oluştur
          const createRes = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', name: 'Notlarım' })
          });
          
          if (createRes.ok) {
            const createData = await createRes.json();
            catId = createData.category?.id;
          }
        }
        
        // Eğer hiçbir şekilde kategori id alınamadıysa yedek olarak ilk kategoriyi kullan
        if (!catId && categoriesList.length > 0) {
          catId = categoriesList[0].id;
        }
      } catch (e) {
        console.error('Kategori işleme hatası:', e);
      }
      
      if (!catId) {
        catId = 'default';
      }
      
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      formData.append('name', fileName);
      formData.append('categoryId', catId);
      formData.append('date', new Date().toISOString().split('T')[0]);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      setNoteStates(prev => ({ ...prev, [msgId]: 'saved' }));
    } catch (err) {
      console.error('PDF kaydetme hatası:', err);
      setNoteStates(prev => ({ ...prev, [msgId]: 'idle' }));
      alert(err instanceof Error ? err.message : 'Dosya kaydedilirken bir hata oluştu.');
    }
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: question,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, fileId: currentFileId, mode }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.error ?? data.answer ?? 'Yanıt alınamadı.',
        title: data.title ?? 'Calisma_Notu',
        sources: data.sources ?? [],
        hasConflict: data.hasConflict ?? false,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
          sources: [],
          hasConflict: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Yüzen Buton (Sol Orta) */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`fixed top-1/2 -translate-y-1/2 z-[9999] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'left-[400px] rounded-r-xl' : 'left-0 rounded-r-2xl'}`}
        style={{
          width: 48,
          height: 64,
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          boxShadow: '4px 0 24px rgba(22,163,74,0.5)',
        }}
        aria-label="AI Asistanı Aç"
        id="ai-chat-toggle-btn"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
      </button>

      {/* Chat Paneli (Sol Kenar Drawer) */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 left-0 z-[9998] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 400,
          height: '85vh',
          maxHeight: 800,
          background: 'rgba(10,12,14,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderLeft: 'none',
          borderRadius: '0 20px 20px 0',
          boxShadow: '8px 0 48px rgba(0,0,0,0.7), 1px 0 0 rgba(34,197,94,0.08)',
        }}
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
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-white"
                style={{ background: 'transparent' }}
                title="Kapat"
                id="ai-chat-close-btn"
              >
                <X size={16} />
              </button>
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

                {/* AI cevabı altında kaynaklar */}
                {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                    {msg.sources.slice(0, 5).map((src, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const viewerUrl = `/viewer?url=${encodeURIComponent(src.url)}&page=${src.page}${src.fileId ? `&fileId=${src.fileId}` : ''}`;
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

                {/* Çelişki uyarısı */}
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

                {/* Çalışma Notu Olarak Kaydet Butonu */}
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => {
                        const msgIndex = messages.findIndex(m => m.id === msg.id);
                        const questionMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
                        const questionText = questionMsg ? questionMsg.text : 'AI Çalışma Notu';
                        handleSaveAsPDF(msg.id, questionText, msg.text, msg.title);
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

            {/* Loading */}
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

          {/* Input Alanı */}
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
        </div>
    </>
  );
}
