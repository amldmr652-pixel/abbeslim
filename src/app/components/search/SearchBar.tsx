'use client';

import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchInput: (value: string) => void;
  listening: boolean;
  isSearching: boolean;
}

export default function SearchBar({ searchQuery, onSearchInput, listening, isSearching }: SearchBarProps) {
  return (
    <div className="w-full glass rounded-full p-4 px-6 flex items-center gap-4 mb-5 relative shadow-lg">
      <Search className={listening ? 'text-green-400 animate-pulse' : 'text-green-600'} size={24} />
      <input
        type="text"
        placeholder="Aramak istediğiniz konuyu yazın veya mikrofona basın..."
        className="bg-transparent border-none outline-none flex-1 text-lg text-white placeholder-gray-500"
        value={searchQuery}
        onChange={(e) => onSearchInput(e.target.value)}
      />
      {isSearching && (
        <Loader2 className="absolute right-6 text-green-500 animate-spin" size={20} />
      )}
    </div>
  );
}
