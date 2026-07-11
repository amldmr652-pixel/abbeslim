'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Modal } from '@/app/components/ui';
import { useNoteStore, Note } from '@/stores/useNoteStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { StickyNote, Plus, AlertCircle, Pin, Trash2, Mic, Square, Play, Pause } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotesPage() {
  const { t, language } = useTranslation();
  const { notes, isLoading, fetchNotes, addNote, deleteNote, togglePin, uploadAudio } = useNoteStore();
  const [user, setUser] = useState<any>(null);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    } catch (err) {
      console.error("Mikrofon izni alınamadı:", err);
      alert("Mikrofon izni reddedildi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !audioBlob) return;
    
    let uploadedAudioUrl = null;
    if (audioBlob) {
      const file = new File([audioBlob], 'audio_note.webm', { type: 'audio/webm' });
      uploadedAudioUrl = await uploadAudio(file);
    }

    if (editingNote) {
      // Update logic will be here for Phase 6, currently just add works
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
            <h1 className="text-3xl font-bold text-white">Notlarım</h1>
            <p className="text-gray-400">Düşüncelerinizi, günlüklerinizi ve sesli kayıtlarınızı saklayın.</p>
          </div>
        </div>
        <Button onClick={openNewNote} className="flex items-center gap-2">
          <Plus size={20} /> Yeni Not
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && notes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Yükleniyor...</div>
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
        title="Yeni Not"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <Input 
            placeholder="Başlık..." 
            value={title} 
            onChange={setTitle} 
            className="text-lg font-bold"
          />
          
          <div className="border border-green-900/50 rounded-2xl bg-black/50 overflow-hidden focus-within:border-green-500 transition-colors">
            <textarea
              className="w-full h-64 p-4 bg-transparent text-white outline-none resize-none placeholder-gray-600"
              placeholder="Markdown formatında yazabilirsiniz..."
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
                    <Square size={16} fill="currentColor" /> Kaydı Durdur
                  </button>
                ) : (
                  <button 
                    onClick={startRecording}
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Mic size={16} /> Ses Kaydet
                  </button>
                )}
                
                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle2 size={16} /> Ses Kaydedildi
                    <button onClick={() => setAudioBlob(null)} className="text-gray-500 hover:text-red-400 ml-2">
                      İptal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={(!content.trim() && !audioBlob)}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
