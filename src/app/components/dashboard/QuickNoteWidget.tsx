'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { StickyNote, Loader2, Mic, MicOff } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useNoteStore } from '@/stores/useNoteStore';
import { useSpeechRecognition } from '@/app/hooks/useSpeechRecognition';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function QuickNoteWidget() {
  const { t } = useTranslation();
  const [noteText, setNoteText] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const { addNote } = useNoteStore();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const speech = useSpeechRecognition({
    onTranscriptChange: (text) => {
      setNoteText(initialNote + (initialNote && text ? ' ' : '') + text);
    },
    onSearch: () => {}, // Hızlı notta arama tetiklenmez
  });

  const handleToggleListen = () => {
    if (!speech.listening) {
      setInitialNote(noteText);
    }
    speech.toggleListen();
  };

  const handleSave = async () => {
    if (!noteText.trim() || !user) return;
    setIsSaving(true);
    
    try {
      await addNote({
        user_id: user.id,
        title: 'Hızlı Not',
        content: noteText,
        is_pinned: false,
        audio_url: null
      });
      
      setSaveStatus('saved');
      setNoteText('');
      setInitialNote('');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving quick note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-5">
        <Link href="/notes" className="text-lg font-semibold text-white flex items-center gap-2 hover:text-green-400 transition-colors">
          <StickyNote size={18} className="text-yellow-400" /> {t('dashboard.quickNote')}
        </Link>
        <div className="flex items-center gap-3">
          {speech.micSupported && (
            <button
              onClick={handleToggleListen}
              className={`p-2 rounded-full transition-colors ${
                speech.listening 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
              }`}
              title={speech.listening ? "Dinlemeyi durdur" : "Sesli not yaz"}
            >
              {speech.listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full animate-in fade-in duration-300">
              {t('common.success')}!
            </span>
          )}
        </div>
      </div>
      
      <textarea
        value={noteText}
        onChange={(e) => {
          setNoteText(e.target.value);
          if (!speech.listening) setInitialNote(e.target.value);
        }}
        placeholder={speech.listening ? "Sizi dinliyorum..." : t('dashboard.writeNotePlaceholder')}
        disabled={!user}
        className={`w-full h-36 bg-black/30 border rounded-2xl p-4 text-sm placeholder-gray-600 resize-none focus:outline-none transition-colors disabled:opacity-50 ${
          speech.listening ? 'border-red-500/50 text-red-100' : 'border-green-900/30 text-white focus:border-green-500/50'
        }`}
      />
      
      <div className="mt-3 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving || !noteText.trim() || !user}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2 rounded-full transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </Card>
  );
}


