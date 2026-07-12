'use client';

import { useState, useEffect } from 'react';
import { Clapperboard, Plus, Star, Tv, Book, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useTrackerStore, MediaItem, MediaType, MediaStatus } from '@/stores/useTrackerStore';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

export default function TrackerPage() {
  const { t } = useTranslation();
  const { items, fetchItems, addItem, updateItem, deleteItem } = useTrackerStore();
  const [userId, setUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<MediaType>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [status, setStatus] = useState<MediaStatus>('planned');
  const [posterUrl, setPosterUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [tmdbId, setTmdbId] = useState<string | null>(null);
  
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchItems();
    
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [fetchItems]);

  useEffect(() => {
    const searchApi = async () => {
      if (title.length < 3 || tmdbId) {
        setTmdbResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        if (mediaType === 'book') {
          // OpenLibrary API (Free, no rate limit issues like Google Books)
          const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5`);
          const data = await res.json();
          const formattedResults = (data.docs || []).map((item: any) => {
            let poster = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null;
            return {
              id: item.key,
              title: item.title,
              name: item.title,
              release_date: item.first_publish_year ? item.first_publish_year.toString() : '',
              vote_average: 0,
              poster_path: poster,
              is_google_book: true // Keeps the same rendering logic
            };
          });
          setTmdbResults(formattedResults);
        } else {
          // TMDB API
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
          if (!apiKey) return;
          const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
          const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(title)}&page=1`);
          const data = await res.json();
          setTmdbResults(data.results?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Search Error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchApi, 500);
    return () => clearTimeout(debounce);
  }, [title, mediaType, tmdbId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setTmdbId(null);
  };

  const handleSelectTmdb = (item: any) => {
    setTitle(item.title || item.name);
    setTmdbId(item.id.toString());
    
    if (item.is_google_book) {
      setPosterUrl(item.poster_path || '');
    } else {
      if (item.poster_path) {
        setPosterUrl(`https://image.tmdb.org/t/p/w500${item.poster_path}`);
      } else {
        setPosterUrl('');
      }
    }
    setTmdbResults([]);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;

    await addItem({
      user_id: userId,
      title,
      media_type: mediaType,
      status,
      rating,
      poster_url: posterUrl.trim() || null,
      tmdb_id: tmdbId,
    });

    setIsModalOpen(false);
    setTitle('');
    setMediaType('movie');
    setStatus('planned');
    setPosterUrl('');
    setRating(0);
    setTmdbId(null);
  };

  const filteredItems = items.filter(item => item.media_type === activeTab);

  const getStatusColor = (s: MediaStatus) => {
    switch (s) {
      case 'planned': return 'bg-gray-600/50 text-gray-300 border-gray-500/30';
      case 'active': return 'bg-yellow-600/50 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-600/50 text-green-300 border-green-500/30';
    }
  };

  const renderStars = (currentRating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate && onRate(star)}
            className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
              star <= currentRating ? 'text-yellow-400' : 'text-gray-600'
            }`}
          >
            <Star size={interactive ? 24 : 16} fill={star <= currentRating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clapperboard className="text-green-500" size={32} />
            {t('tracker.title')}
          </h1>
          <p className="text-gray-400 mt-2">{t('tracker.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> {t('tracker.newItem')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-green-900/30 pb-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('movie')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
            activeTab === 'movie' 
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          <Clapperboard size={18} /> {t('tracker.movies')}
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
            activeTab === 'series' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          <Tv size={18} /> {t('tracker.series')}
        </button>
        <button
          onClick={() => setActiveTab('book')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
            activeTab === 'book' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          <Book size={18} /> {t('tracker.books')}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-20 glass rounded-3xl">
            {t('tracker.noItems')}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden glass hover:-translate-y-2 transition-all duration-300">
              {/* Poster */}
              <div className="aspect-[2/3] w-full bg-black/50 relative">
                {item.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={item.poster_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                    <ImageIcon size={40} />
                    <span className="text-xs">No Poster</span>
                  </div>
                )}
                
                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 bg-black/50 p-2 rounded-full backdrop-blur-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, { status: e.target.value as MediaStatus })}
                      className="w-full bg-white/10 text-white text-xs rounded-lg p-2 outline-none cursor-pointer"
                    >
                      <option value="planned">{t('tracker.planned')}</option>
                      <option value="active">{t('tracker.active')}</option>
                      <option value="completed">{t('tracker.completed')}</option>
                    </select>
                    
                    <div className="flex justify-center bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                      {renderStars(item.rating, true, (r) => updateItem(item.id, { rating: r }))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-bold text-white text-sm line-clamp-1 mb-1" title={item.title}>
                  {item.title}
                </h3>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                    {t(`tracker.${item.status}`)}
                  </span>
                  {item.rating > 0 && (
                    <span className="text-xs text-yellow-400 flex items-center">
                      <Star size={10} fill="currentColor" className="mr-0.5" />
                      {item.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('tracker.newItem')} maxWidth="sm">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            {(['movie', 'series', 'book'] as MediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  mediaType === type ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t(`tracker.${type === 'movie' ? 'movies' : type === 'series' ? 'series' : 'books'}`)}
              </button>
            ))}
          </div>

          <div className="relative">
            <label className="text-sm text-gray-400 block mb-2">{t('tracker.titleLabel')}</label>
            <Input 
              value={title}
              onChange={handleTitleChange}
              placeholder={t('tracker.titlePlaceholder')}
              required
            />
            {isSearching && (
              <div className="absolute right-3 top-10 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            )}
            
            {/* TMDB Results Dropdown */}
            {tmdbResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-white/10 rounded-xl overflow-hidden z-50 backdrop-blur-xl shadow-2xl">
                {tmdbResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectTmdb(res)}
                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                  >
                    {res.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://image.tmdb.org/t/p/w92${res.poster_path}`} alt="" className="w-8 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-12 bg-white/5 rounded flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm text-white font-medium truncate">{res.title || res.name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {(res.release_date || res.first_air_date)?.split('-')[0] || ''}
                        {res.vote_average ? ` • ⭐ ${res.vote_average.toFixed(1)}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('tracker.posterUrl')}</label>
            <Input 
              value={posterUrl}
              onChange={(val) => setPosterUrl(val as string)}
              placeholder={t('tracker.posterPlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('tracker.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MediaStatus)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
            >
              <option value="planned" className="bg-black text-white">{t('tracker.planned')}</option>
              <option value="active" className="bg-black text-white">{t('tracker.active')}</option>
              <option value="completed" className="bg-black text-white">{t('tracker.completed')}</option>
            </select>
          </div>

          {status === 'completed' && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">{t('tracker.rating')}</label>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex justify-center">
                {renderStars(rating, true, setRating)}
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-green-600 hover:bg-green-500">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
