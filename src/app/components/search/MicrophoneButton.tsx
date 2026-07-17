'use client';

import { Mic } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface MicrophoneButtonProps {
  listening: boolean;
  micSupported: boolean;
  toggleListen: () => void;
  searchQuery: string;
  isSearching: boolean;
  speechLanguage?: string;
  setSpeechLanguage?: (lang: string) => void;
}

export default function MicrophoneButton({
  listening,
  micSupported,
  toggleListen,
  searchQuery,
  isSearching,
  speechLanguage,
  setSpeechLanguage,
}: MicrophoneButtonProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mikrofon Butonu */}
      <div className="relative flex justify-center items-center mb-4 h-48 w-48">
        <button
          onClick={toggleListen}
          disabled={!micSupported}
          aria-label={listening ? t('search.stopListening') : t('search.startListening')}
          className={`absolute z-10 p-8 rounded-full transition-all duration-300 ${
            listening
              ? 'bg-green-500 scale-110 shadow-[0_0_50px_rgba(34,197,94,0.4)]'
              : 'glass hover:bg-green-900/40'
          } ${!micSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Mic size={64} className={listening ? 'text-black' : 'text-green-500'} />
        </button>
        {listening && <div className="absolute inset-0 rounded-full mic-active-pulse" />}
      </div>

      {/* Konuşma Dili Seçici */}
      {setSpeechLanguage && (
        <div className="flex gap-2.5 mb-6 justify-center z-10">
          <button
            onClick={() => setSpeechLanguage('tr')}
            disabled={listening}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              listening ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              speechLanguage === 'tr'
                ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            Türkçe (TR)
          </button>
          <button
            onClick={() => setSpeechLanguage('ar')}
            disabled={listening}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              listening ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              speechLanguage === 'ar'
                ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            العربية (AR)
          </button>
          <button
            onClick={() => setSpeechLanguage('en')}
            disabled={listening}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              listening ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              speechLanguage === 'en'
                ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            English (EN)
          </button>
        </div>
      )}

      {/* Dinleme durumu */}
      <div className="h-8 mb-6 flex items-center justify-center">
        {listening ? (
          <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block" />
            {t('search.listening')}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="text-gray-500 text-sm">
            {t('search.resultsFor').replace('{query}', searchQuery)}
          </div>
        ) : null}
      </div>
    </>
  );
}
