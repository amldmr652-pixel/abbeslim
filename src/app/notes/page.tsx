'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input } from '@/app/components/ui';
import { useNoteStore, Note } from '@/stores/useNoteStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { StickyNote, Plus, AlertCircle, Pin, Trash2, Mic, Square, Save, Loader2, BookOpen, Clock, X, Menu, ChevronLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotesPage() {
  const { t, language } = useTranslation();
  const settings = useSettingsStore();
  const { notes, isLoading, fetchNotes, addNote, updateNote, deleteNote, togglePin, uploadAudio } = useNoteStore();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  
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

  // Debounced auto-save effect
  useEffect(() => {
    if (!isEditing || !activeNote) return;
    if (!settings.notesAutoSave) return;

    const intervalTime = (settings.notesAutoSaveInterval || 30) * 1000;

    const timer = setTimeout(async () => {
      try {
        await updateNote(activeNote.id, {
          title: title.trim() || 'İsimsiz Not',
          content,
        });
      } catch (err) {
        console.error("Auto save failed:", err);
      }
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [content, title, isEditing, activeNote, settings.notesAutoSave, settings.notesAutoSaveInterval, updateNote]);

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
    setAudioBlob(null);
    setShowMobileSidebar(false); // Hide list on mobile when note is selected
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
    setAudioBlob(null);
    setShowMobileSidebar(false); // Hide list on mobile
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

      startSpeechRecognition();
    } catch (err) {
      console.error("Mikrofon izni alınamadı:", err);
      alert("Mikrofon izni reddedildi.");
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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
      setContent(prev => {
        const base = prev.endsWith('\n') || prev === '' ? prev : prev + '\n';
        if (finalTranscript) {
          return base + '🎤 ' + finalTranscript.trim();
        }
        return prev;
      });
      setIsTranscribing(!!interimTranscript);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error in notes page:", e);
      setIsTranscribing(false);
    };
    recognition.onend = () => {
      setIsTranscribing(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          recognition.start();
        } catch (err) {
          console.error("Failed to restart speech recognition in notes page:", err);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  };

  const handleSave = async () => {
    if (!user || (!content.trim() && !title.trim())) return;
    setIsSaving(true);
    
    try {
      let uploadedAudioUrl = activeNote?.audio_url || null;
      if (audioBlob) {
        const file = new File([audioBlob], 'audio_note.webm', { type: 'audio/webm' });
        uploadedAudioUrl = await uploadAudio(file);
      }

      if (activeNote) {
        await updateNote(activeNote.id, {
          title: title.trim() || 'İsimsiz Not',
          content,
          audio_url: uploadedAudioUrl
        });
        setIsEditing(false);
        // Refresh active note
        const updated = notes.find(n => n.id === activeNote.id);
        if (updated) setActiveNote({ ...updated, title, content, audio_url: uploadedAudioUrl });
      } else {
        const newNote = await addNote({
          user_id: user.id,
          title: title.trim() || 'İsimsiz Not',
          content,
          audio_url: uploadedAudioUrl,
          is_pinned: false
        });
        setActiveNote(newNote);
        setIsEditing(false);
      }
      setAudioBlob(null);
    } catch (e) {
      console.error("Not kaydedilemedi:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const fontSize = settings.notesFontSize === 'small' ? '13px' : settings.notesFontSize === 'large' ? '17px' : '15px';

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
        <p className="text-gray-400">Notlarınızı görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] p-4 md:p-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex h-full gap-6">
        
        {/* Sol Panel: Not Listesi */}
        <div className={`w-full md:w-80 flex flex-col gap-4 border-r border-white/5 pr-4 md:flex ${
          showMobileSidebar ? 'flex' : 'hidden'
        }`}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-green-500" size={24} />
              {t('sidebar.notes') || 'Notlar'}
            </h1>
            <button 
              onClick={handleNewNote}
              className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Notlarda ara..."
              className="text-xs py-2 px-3 bg-black/40 border-stone-800"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {isLoading && notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('common.loading') || 'Yükleniyor...'}</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-black/20 rounded-2xl border border-white/5 border-dashed">
                {searchQuery ? 'Sonuç bulunamadı.' : 'Henüz hiç notunuz yok.'}
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeNote?.id === note.id ? 'bg-green-900/20 border-green-500/30' : 'glass border-transparent hover:border-white/10'}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-white truncate pr-2 text-sm">{note.title}</h3>
                    {note.is_pinned && <Pin size={12} className="text-green-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2 opacity-80">
                    {note.content.substring(0, 80) || 'Boş not...'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div> 

        {/* Sağ Panel: Editör / Görüntüleyici */}
        <div className={`flex-1 flex flex-col h-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative ${
          showMobileSidebar ? 'hidden md:flex' : 'flex'
        }`}>
          {!activeNote && !isEditing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
              <StickyNote size={64} className="opacity-20 mb-4 animate-[pulse_3s_infinite]" />
              <p>Görüntülemek için bir not seçin veya yeni oluşturun.</p>
              <Button onClick={handleNewNote} className="mt-4 flex items-center gap-2">
                <Plus size={16} /> Yeni Not Oluştur
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full justify-between">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden flex items-center gap-1.5 text-xs text-green-400 font-semibold px-2 py-1.5 bg-green-500/10 rounded-lg hover:bg-green-500/20 mr-2 border border-green-500/20"
                  >
                    <ChevronLeft size={16} /> {t('common.back') || 'Geri'}
                  </button>

                  {!isEditing && activeNote ? (
                    <>
                      <Button onClick={() => setIsEditing(true)} variant="secondary" className="!py-1.5 !px-4 !text-sm">Düzenle</Button>
                      <button 
                        onClick={() => {
                          if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
                            deleteNote(activeNote.id);
                            setActiveNote(null);
                            setShowMobileSidebar(true);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleSave} disabled={isSaving} className="!py-1.5 !px-4 !text-sm flex items-center gap-2">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Kaydet
                      </Button>
                      {activeNote && (
                        <Button onClick={() => {
                          setIsEditing(false);
                          setTitle(activeNote.title);
                          setContent(activeNote.content);
                        }} variant="ghost" className="!py-1.5 !px-4 !text-sm text-gray-400 hover:text-white">
                          İptal
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      }`}
                    >
                      {isRecording ? (
                        <><Square size={14} className="fill-current" /> {isTranscribing ? 'Dinleniyor...' : 'Durdur'}</>
                      ) : (
                        <><Mic size={14} /> Sesle Yaz</>
                      )}
                    </button>
                  )}
                  {activeNote && !isEditing && (
                    <button 
                      onClick={() => togglePin(activeNote.id, activeNote.is_pinned)}
                      className={`p-2 rounded-xl transition-colors ${activeNote.is_pinned ? 'text-green-400 bg-green-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                      title={activeNote.is_pinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
                    >
                      <Pin size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Editor / Viewer Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                {isEditing ? (
                  <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Not Başlığı..."
                      className="text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600 w-full"
                    />
                    
                    {audioBlob && (
                      <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-xl border border-green-500/30">
                        <Mic size={16} className="text-green-400" />
                        <span className="text-sm text-green-100 flex-1">Yeni ses kaydı eklendi</span>
                        <button onClick={() => setAudioBlob(null)} className="p-1 hover:bg-black/20 rounded-lg text-gray-400 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{ fontSize }}
                      placeholder="Markdown formatında notunu buraya yaz... 

Örneğin:
# Büyük Başlık
## Küçük Başlık
- Liste öğesi 1
- Liste öğesi 2
**Kalın Yazı**"
                      className="flex-1 bg-transparent border-none outline-none text-gray-300 resize-none font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-8">{activeNote?.title}</h1>
                    
                    {activeNote?.audio_url && (
                      <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                          <Mic size={12} /> Ses Kaydı
                        </h4>
                        <audio controls className="w-full h-10" src={activeNote.audio_url}></audio>
                      </div>
                    )}

                    <div 
                      className="prose prose-invert prose-green prose-lg max-w-none prose-headings:font-bold prose-a:text-green-400 hover:prose-a:text-green-300"
                      style={{ fontSize }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeNote?.content || '*Boş not...*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Word & Char Counter bar inside editor */}
              {isEditing && (
                <div className="flex justify-between items-center px-6 py-2.5 bg-stone-900/30 border-t border-white/5 text-[10px] text-gray-500">
                  <div>{wordCount} kelime • {charCount} karakter</div>
                  {settings.notesAutoSave && (
                    <div className="text-green-500/60">Otomatik kaydetme aktif ({settings.notesAutoSaveInterval}s)</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
