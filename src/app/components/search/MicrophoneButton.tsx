'use client';

import { Mic } from 'lucide-react';

interface MicrophoneButtonProps {
  listening: boolean;
  micSupported: boolean;
  toggleListen: () => void;
  searchQuery: string;
  isSearching: boolean;
}

export default function MicrophoneButton({ listening, micSupported, toggleListen, searchQuery, isSearching }: MicrophoneButtonProps) {
  return (
    <>
      {/* Mikrofon Butonu */}
      <div className="relative flex justify-center items-center mb-6 h-48 w-48">
        <button
          onClick={toggleListen}
          disabled={!micSupported}
          aria-label={listening ? 'Dinlemeyi Durdur' : 'Dinlemeyi Başlat'}
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

      {/* Dinleme durumu */}
      <div className="h-8 mb-6 flex items-center justify-center">
        {listening ? (
          <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block" />
            Dinliyorum… Konuşun, bitince butona tekrar basın
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="text-gray-500 text-sm">
            &quot;{searchQuery}&quot; için sonuçlar
          </div>
        ) : null}
      </div>
    </>
  );
}
