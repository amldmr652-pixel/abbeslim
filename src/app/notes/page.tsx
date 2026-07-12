'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input, Modal } from '@/app/components/ui';
import { useNoteStore, Note } from '@/stores/useNoteStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { StickyNote, Plus, AlertCircle, Pin, Trash2, Mic, Square, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotesPage() {
  const { t, language } = useTranslation();
  const { notes, isLoading, fetchNotes, addNote, deleteNote, togglePin, uploadAudio } = useNoteStore();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchNotes();
      }
    });
  }, [fetchNotes]);

  const openNewNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setAudioBlob(null);
    setIsEditorOpen(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Paralel olarak Speech Recognition başlat (ses → metin)
      startSpeechRecognition();
    } catch (err) {
      console.error("Mikrofon izni alınamadı:", err);
      alert("Mikrofon izni reddedildi.");
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API desteklenmiyor');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR';

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript = transcript;
        }
      }
      // Mevcut içeriğe ekle
      setContent(prev => {
        // Sadece yeni final transcript'i ekle
        const base = prev.endsWith('\n') || prev === '' ? prev : prev + '\n';
        if (finalTranscript) {
          return base + '🎤 ' + finalTranscript.trim();
        }
        return prev;
      });
      setIsTranscribing(!!interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition hatası:', event.error);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Speech Recognition'ı da durdur
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim() && !audioBlob) return;
    
    let uploadedAudioUrl = null;
    if (audioBlob) {
      const file = new File([audioBlob], 'audio_note.webm', { type: 'audio/webm' });
      uploadedAudioUrl = await uploadAudio(file);
    }

    if (editingNote) {
      // Update logic will be here for Phase 6
    } else {
      await addNote({
        user_id: user.id,
        title: title.trim() || 'İsimsiz Not',
        content,
        audio_url: uploadedAudioUrl,
        is_pinned: false
      });
    }

    setIsEditorOpen(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Giriş Yapmanız Gerekiyor</h2>
        <p className="text-gray-400">Notlarınızı görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <StickyNote className="text-green-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white">{t('notes.title')}</h1>
            <p className="text-gray-400">Düşüncelerinizi, günlüklerinizi ve sesli kayıtlarınızı saklayın.</p>
          </div>
        </div>
        <Button onClick={openNewNote} className="flex items-center gap-2">
          <Plus size={20} /> {t('notes.newNote')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && notes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : notes.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-green-900/30 rounded-3xl bg-black/20">
            <p className="text-gray-500">Henüz hiç not eklemediniz.</p>
          </div>
        ) : (
          notes.map(note => (
            <Card key={note.id} hover className="flex flex-col h-[280px]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-white truncate pr-2">{note.title}</h3>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => togglePin(note.id, note.is_pinned)}
                    className={`p-1.5 rounded-full transition-colors ${note.is_pinned ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Pin size={16} />
                  </button>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 mb-2">
                {new Date(note.created_at).toLocaleDateString()}
              </div>

              <div className="flex-1 overflow-hidden prose prose-invert prose-sm prose-green line-clamp-6 opacity-80 relative">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.content}
                </ReactMarkdown>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none"></div>
              </div>

              {note.audio_url && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <audio controls className="w-full h-8" src={note.audio_url}></audio>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={t('notes.newNote')}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <Input 
            placeholder={t('notes.titlePlaceholder')} 
            value={title} 
            onChange={setTitle} 
            className="text-lg font-bold"
          />
          
          <div className="border border-green-900/50 rounded-2xl bg-black/50 overflow-hidden focus-within:border-green-500 transition-colors">
            <textarea
              className="w-full h-64 p-4 bg-transparent text-white outline-none resize-none placeholder-gray-600"
              placeholder={t('notes.contentPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            <div className="bg-white/5 p-3 flex items-center justify-between border-t border-green-900/50">
              <div className="flex items-center gap-4">
                {isRecording ? (
                  <button 
                    onClick={stopRecording}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-900/20 px-3 py-1.5 rounded-full animate-pulse"
                  >
                    <Square size={16} fill="currentColor" /> {t('notes.stopRecording')}
                  </button>
                ) : (
                  <button 
                    onClick={startRecording}
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Mic size={16} /> {t('notes.record')}
                  </button>
                )}
                
                {isTranscribing && (
                  <span className="text-xs text-yellow-400 animate-pulse">
                    ✍️ Metin yazılıyor...
                  </span>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle2 size={16} /> {t('notes.recorded')}
                    <button onClick={() => setAudioBlob(null)} className="text-gray-500 hover:text-red-400 ml-2">
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={(!content.trim() && !audioBlob)}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
