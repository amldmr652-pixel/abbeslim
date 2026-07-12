import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';

export interface Source {
  fileName: string;
  page: string | number;
  fileId: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  title?: string;
  sources?: Source[];
  hasConflict?: boolean;
}

export function useChat(currentFileId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'sources' | 'independent' | 'hybrid'>('hybrid');
  const [noteStates, setNoteStates] = useState<{ [msgId: string]: 'idle' | 'saving' | 'saved' }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      doc.addFileToVFS('Roboto-Regular.ttf', base64Regular);
      doc.addFileToVFS('Roboto-Medium.ttf', base64Bold);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      
      let y = 20;

      doc.setFont('Roboto', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(22, 163, 74);
      doc.text('abbeslim Çalışma Notu', margin, y);
      
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 10;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, margin, y);
      
      y += 10;
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text('SORU:', margin, y);
      
      y += 6;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const splitQuestion = doc.splitTextToSize(question, contentWidth);
      doc.text(splitQuestion, margin, y);
      y += splitQuestion.length * 5 + 5;
      
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 10;
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(22, 163, 74);
      doc.text('AI YANITI / ÖZET:', margin, y);
      
      y += 6;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      
      const cleanAnswer = answer.replace(/\*\*/g, '').replace(/\*/g, '');
      const splitAnswer = doc.splitTextToSize(cleanAnswer, contentWidth);
      
      const lineHeight = 6;
      for (let i = 0; i < splitAnswer.length; i++) {
        if (y > pageHeight - margin) {
          doc.addPage();
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
        
        const existingCat = categoriesList.find(
          (c: any) => c.name.toLowerCase() === 'notlarım' || c.name.toLowerCase() === 'notlarim'
        );
        
        if (existingCat) {
          catId = existingCat.id;
        } else {
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

  const clearChat = () => setMessages([]);

  return {
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
  };
}
