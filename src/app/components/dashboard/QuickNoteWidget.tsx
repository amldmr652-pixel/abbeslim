'use client';

import { useState } from 'react';
import { StickyNote, Loader2 } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function QuickNoteWidget() {
  const { t } = useTranslation();
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleSave = () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    
    // Faz 5 (Not Sistemi) gelene kadar sadece UI mock işlemi
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('saved');
      setNoteText('');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <StickyNote size={18} className="text-yellow-400" /> {t('dashboard.quickNote')}
        </h2>
        {saveStatus === 'saved' && (
          <span className="text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full animate-in fade-in duration-300">
            {t('common.success')}!
          </span>
        )}
      </div>
      
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder={t('dashboard.writeNotePlaceholder')}
        className="w-full h-36 bg-black/30 border border-green-900/30 rounded-2xl p-4 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-green-500/50 transition-colors"
      />
      
      <div className="mt-3 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving || !noteText.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2 rounded-full transition-colors flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </Card>
  );
}
