'use client';

import type { SearchMode } from '@/app/hooks/useSearch';

interface SearchModeSelectorProps {
  searchMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const modes: { key: SearchMode; label: string; icon: string }[] = [
  { key: 'hybrid', label: 'Hibrit', icon: '🌀' },
  { key: 'phrase', label: 'Cümle', icon: '🔤' },
  { key: 'word', label: 'Kelime', icon: '🔠' },
  { key: 'semantic', label: 'Mana (AI)', icon: '✨' },
];

export default function SearchModeSelector({ searchMode, onModeChange }: SearchModeSelectorProps) {
  return (
    <div className="flex gap-1.5 p-1 bg-[#121212]/80 border border-green-900/30 rounded-full mb-10 max-w-md w-full justify-around shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      {modes.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            searchMode === key
              ? 'bg-green-700 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
