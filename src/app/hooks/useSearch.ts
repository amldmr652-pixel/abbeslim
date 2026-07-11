'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type SearchMode = 'phrase' | 'word' | 'semantic' | 'hybrid';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');

  const categoriesRef = useRef<any[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTranscriptRef = useRef('');

  useEffect(() => {
    // Kategorileri çek
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setCategories(data.categories);
          categoriesRef.current = data.categories;
        }
      })
      .catch(err => console.error('Kategori hatası:', err));
  }, []);

  // -------------------------------------------------------
  // Arama fonksiyonu
  // -------------------------------------------------------
  const doSearch = useCallback((query: string, mode: SearchMode = searchMode) => {
    const q = query.trim();
    if (!q) { setSearchResults([]); return; }
    setIsSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&mode=${mode}`)
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          setSearchResults(
            data.results.map((r: any) => {
              const cat = categoriesRef.current.find(c => c.id === r.categoryId);
              return { ...r, categoryName: cat ? cat.name : r.categoryId };
            })
          );
        }
      })
      .catch(err => console.error('Arama hatası:', err))
      .finally(() => setIsSearching(false));
  }, [searchMode]);

  // Arama modunu değiştirme ve anında arama
  const handleModeChange = (newMode: SearchMode) => {
    setSearchMode(newMode);
    if (searchQuery.trim()) {
      doSearch(searchQuery, newMode);
    }
  };

  // Elle yazınca debounced arama
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    currentTranscriptRef.current = value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(() => doSearch(value), 500);
  };

  // Simülasyon ile Arama Tetikleme
  const handleSimulatedSearch = (query: string) => {
    setSearchQuery(query);
    currentTranscriptRef.current = query;
    doSearch(query);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    categories,
    searchMode,
    categoriesRef,
    searchTimeoutRef,
    currentTranscriptRef,
    doSearch,
    handleModeChange,
    handleSearchInput,
    handleSimulatedSearch,
  };
}
