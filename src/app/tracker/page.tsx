'use client';

import { useState, useEffect } from 'react';
import { Clapperboard, Plus, Star, Tv, Book, Image as ImageIcon, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useTrackerStore, MediaItem, MediaType, MediaStatus } from '@/stores/useTrackerStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createClient } from '@/utils/supabase/client';
import { apiClient } from '@/lib/apiClient';

export default function TrackerPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const { items, fetchItems, addItem, updateItem, deleteItem } = useTrackerStore();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState<MediaType>('movie');
  const [activeStatus, setActiveStatus] = useState<MediaStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'date'>('date');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Sync settings default type on mount
  useEffect(() => {
    if (settings.trackerDefaultType) {
      setActiveTab(settings.trackerDefaultType === 'show' ? 'series' : settings.trackerDefaultType);
    }
  }, [settings.trackerDefaultType]);

  // Add Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [status, setStatus] = useState<MediaStatus>('planned');
  const [posterUrl, setPosterUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [tmdbId, setTmdbId] = useState<string | null>(null);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Edit Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<MediaStatus>('planned');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editMediaType, setEditMediaType] = useState<MediaType>('movie');

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchItems();
      }
      setLoadingUser(false);
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
        // Backend proxy üzerinden arama (film/dizi için TMDB, kitap için Google Books + OpenLibrary)
        const res = await apiClient(`/api/tracker/search?type=${mediaType}&query=${encodeURIComponent(title)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setTmdbResults(data.results?.slice(0, 10) || []);
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
    
    if (item.poster_path) {
      if (item.poster_path.startsWith('http')) {
        setPosterUrl(item.poster_path);
      } else {
        setPosterUrl(`https://image.tmdb.org/t/p/w500${item.poster_path}`);
      }
    } else {
      setPosterUrl('');
    }
    setTmdbResults([]);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;

    try {
      await addItem({
        user_id: userId,
        title: title.trim(),
        media_type: mediaType,
        status,
        rating,
        poster_url: posterUrl.trim() || null,
        tmdb_id: tmdbId,
      });

      setIsAddModalOpen(false);
      setTitle('');
      setMediaType('movie');
      setStatus('planned');
      setPosterUrl('');
      setRating(0);
      setTmdbId(null);
    } catch (error: any) {
      alert("Öğe kaydedilirken bir hata oluştu: " + (error.message || error));
    }
  };

  const handleOpenEditModal = (item: MediaItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditStatus(item.status);
    setEditPosterUrl(item.poster_url || '');
    setEditRating(item.rating || 0);
    setEditMediaType(item.media_type);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !editTitle.trim()) return;

    try {
      await updateItem(selectedItem.id, {
        title: editTitle.trim(),
        status: editStatus,
        poster_url: editPosterUrl.trim() || null,
        rating: editRating,
        media_type: editMediaType
      });
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      alert("Düzenleme kaydedilemedi.");
    }
  };

  // Filter items
  const filteredItems = items.filter(item => 
    item.media_type === activeTab && 
    (activeStatus === 'all' || item.status === activeStatus) &&
    (ratingFilter === 'all' || 
      (ratingFilter === 'unrated' ? (!item.rating || item.rating === 0) :
       (item.rating || 0) >= parseInt(ratingFilter)))
  );

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    // Default: date added
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const getStatusColor = (s: MediaStatus) => {
    switch (s) {
      case 'planned': return 'bg-stone-800 text-stone-300 border-stone-700';
      case 'active': return 'bg-yellow-950/20 text-yellow-400 border-yellow-500/10';
      case 'completed': return 'bg-green-950/20 text-green-400 border-green-500/10';
    }
  };

  const renderStars = (currentRating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1 items-center justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && onRate) {
                // Tapping the same star resets rating to 0
                onRate(star === currentRating ? 0 : star);
              }
            }}
            className={`p-1.5 transition-all touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl ${
              interactive ? 'cursor-pointer hover:scale-110 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/10' : 'cursor-default'
            } ${
              star <= currentRating
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                : 'text-gray-400 opacity-60 hover:opacity-100 hover:text-yellow-300'
            }`}
            title={interactive ? (star === currentRating ? 'Puanı Sıfırla' : `${star} Yıldız Ver`) : undefined}
          >
            <Star size={interactive ? 20 : 15} fill={star <= currentRating ? 'currentColor' : 'none'} className="shrink-0" />
          </button>
        ))}
      </div>
    );
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-white">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
        <p className="text-gray-400">Takip listenizi görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clapperboard className="text-green-500" size={32} />
            {t('tracker.title') || 'İzleme & Okuma Takibi'}
          </h1>
          <p className="text-gray-400 mt-2">{t('tracker.subtitle') || 'İzlediğiniz dizi, filmleri ve kitapları arşivleyin'}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> {t('tracker.newItem') || 'Yeni Öğe'}
        </Button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-green-900/20 pb-4">
        {/* Type Tabs */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar w-full md:w-auto">
          <button
            onClick={() => setActiveTab('movie')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'movie' 
                ? 'bg-green-500 text-stone-950 shadow-md font-bold' 
                : 'text-gray-400 hover:text-white glass'
            }`}
          >
            <Clapperboard size={16} /> {t('tracker.movies') || 'Filmler'}
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'series' 
                ? 'bg-purple-500 text-stone-950 shadow-md font-bold' 
                : 'text-gray-400 hover:text-white glass'
            }`}
          >
            <Tv size={16} /> {t('tracker.series') || 'Diziler'}
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'book' 
                ? 'bg-blue-500 text-stone-950 shadow-md font-bold' 
                : 'text-gray-400 hover:text-white glass'
            }`}
          >
            <Book size={16} /> {t('tracker.books') || 'Kitaplar'}
          </button>
        </div>

        {/* Status Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Sort bar */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-stone-800 text-xs text-gray-400">
            <span className="font-semibold">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white outline-none border-none pr-4 font-semibold cursor-pointer"
            >
              <option value="date" className="bg-stone-900 text-white">Tarihe Göre</option>
              <option value="rating" className="bg-stone-900 text-white">Puana Göre</option>
              <option value="title" className="bg-stone-900 text-white">İsme Göre</option>
            </select>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-stone-800 text-xs text-gray-400">
            <span className="font-semibold">Puan:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-transparent text-white outline-none border-none pr-4 font-semibold cursor-pointer"
            >
              <option value="all" className="bg-stone-900 text-white">Tümü</option>
              <option value="5" className="bg-stone-900 text-white">⭐ 5</option>
              <option value="4" className="bg-stone-900 text-white">⭐ 4+</option>
              <option value="3" className="bg-stone-900 text-white">⭐ 3+</option>
              <option value="2" className="bg-stone-900 text-white">⭐ 2+</option>
              <option value="1" className="bg-stone-900 text-white">⭐ 1+</option>
              <option value="unrated" className="bg-stone-900 text-white">Puansız</option>
            </select>
          </div>

          {/* Status filters */}
          <div className="flex gap-1.5 bg-black/40 p-1 rounded-full border border-stone-800 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveStatus('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeStatus === 'all' ? 'bg-stone-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Tümü
            </button>
            <button 
              onClick={() => setActiveStatus('planned')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeStatus === 'planned' ? 'bg-stone-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t('tracker.planned') || 'Planlandı'}
            </button>
            <button 
              onClick={() => setActiveStatus('active')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeStatus === 'active' ? 'bg-yellow-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('tracker.active') || 'İzleniyor/Okunuyor'}
            </button>
            <button 
              onClick={() => setActiveStatus('completed')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeStatus === 'completed' ? 'bg-green-600 text-stone-950 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('tracker.completed') || 'Tamamlandı'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {sortedItems.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-20 glass rounded-3xl">
            {t('tracker.noItems') || 'Listeniz henüz boş.'}
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden glass border border-white/[0.03] hover:-translate-y-2 transition-all duration-300">
              {/* Poster */}
              <div className="aspect-[2/3] w-full bg-black/50 relative">
                {item.poster_url && !imageErrors[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={item.poster_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-between p-4 bg-gradient-to-br from-green-950/40 via-stone-900/80 to-black text-center relative overflow-hidden border-b border-white/5">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="w-full flex justify-between items-center z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                        {item.media_type === 'movie' ? 'Film' : item.media_type === 'series' ? 'Dizi' : 'Kitap'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2 z-10 my-auto">
                      <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
                        {item.media_type === 'movie' ? <Clapperboard size={28} /> : item.media_type === 'series' ? <Tv size={28} /> : <Book size={28} />}
                      </div>
                      <span className="text-xs font-bold text-gray-200 line-clamp-2 px-1">
                        {item.title}
                      </span>
                    </div>

                    <span className="text-[9px] text-gray-500 z-10">Görsel eklemek için düzenle</span>
                  </div>
                )}
                
                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 z-10">
                  <div className="flex justify-end gap-1.5">
                    <button 
                      onClick={() => handleOpenEditModal(item)}
                      className="text-gray-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm transition-colors"
                      title="Düzenle"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) deleteItem(item.id);
                      }}
                      className="text-gray-400 hover:text-red-500 bg-black/50 p-2 rounded-full backdrop-blur-sm transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, { status: e.target.value as MediaStatus })}
                      className="w-full bg-stone-900 border border-white/10 text-white text-xs rounded-lg p-2 outline-none cursor-pointer"
                    >
                      <option value="planned">{t('tracker.planned') || 'Planlandı'}</option>
                      <option value="active">{t('tracker.active') || 'Devam Ediyor'}</option>
                      <option value="completed">{t('tracker.completed') || 'Tamamlandı'}</option>
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
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status === 'planned' ? t('tracker.planned') : item.status === 'active' ? t('tracker.active') : t('tracker.completed')}
                  </span>
                  <div className="flex items-center gap-0.5" title={`${item.rating || 0}/5 Yıldız`}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={11}
                        fill={s <= (item.rating || 0) ? 'currentColor' : 'none'}
                        className={s <= (item.rating || 0)
                          ? 'text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]'
                          : 'text-gray-600'
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('tracker.newItem') || 'Yeni Öğe Ekle'} maxWidth="sm">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            {(['movie', 'series', 'book'] as MediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  mediaType === type ? 'bg-green-500 text-stone-950 font-bold shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {type === 'movie' ? 'Film' : type === 'series' ? 'Dizi' : 'Kitap'}
              </button>
            ))}
          </div>

          <div className="relative">
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('tracker.titleLabel') || 'Başlık'}</label>
            <Input 
              value={title}
              onChange={handleTitleChange}
              placeholder={t('tracker.titlePlaceholder') || 'Aramak veya eklemek istediğiniz başlığı girin...'}
              required
            />
            {isSearching && (
              <div className="absolute right-3 top-10 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            )}
            
            {/* TMDB Results Dropdown */}
            {tmdbResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-stone-950 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                {tmdbResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectTmdb(res)}
                    className="w-full text-left p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                  >
                    {res.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={res.poster_path.startsWith('http') ? res.poster_path : `https://image.tmdb.org/t/p/w92${res.poster_path}`} 
                        alt="" 
                        className="w-8 h-12 object-cover rounded" 
                      />
                    ) : (
                      <div className="w-8 h-12 bg-white/5 rounded flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm text-white font-medium truncate">{res.title || res.name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {res.authors && <span>{res.authors} • </span>}
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
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('tracker.posterUrl') || 'Poster / Kapak Resim Linki'}</label>
            <Input 
              value={posterUrl}
              onChange={setPosterUrl}
              placeholder={t('tracker.posterPlaceholder') || 'Görsel linki yapıştırın veya üstten aratın...'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('tracker.status') || 'Durum'}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MediaStatus)}
                className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none text-sm"
              >
                <option value="planned">{t('tracker.planned') || 'Planlandı'}</option>
                <option value="active">{t('tracker.active') || 'Devam Ediyor'}</option>
                <option value="completed">{t('tracker.completed') || 'Tamamlandı'}</option>
              </select>
            </div>
            
            {status === 'completed' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('tracker.rating') || 'Puan'}</label>
                <div className="bg-black/50 border border-green-900/50 p-2.5 rounded-2xl flex justify-center">
                  {renderStars(rating, true, setRating)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" className="bg-green-600 text-stone-950 font-bold hover:bg-green-500">
              {t('common.save') || 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedItem(null); }} title="Öğeyi Düzenle" maxWidth="sm">
        <form onSubmit={handleUpdateItem} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Başlık</label>
            <Input 
              value={editTitle}
              onChange={setEditTitle}
              required
            />
          </div>

          <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/5 mb-4">
            {(['movie', 'series', 'book'] as MediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEditMediaType(type)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  editMediaType === type ? 'bg-green-500 text-stone-950 font-bold shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {type === 'movie' ? 'Film' : type === 'series' ? 'Dizi' : 'Kitap'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Poster / Kapak Resim Linki</label>
            <Input 
              value={editPosterUrl}
              onChange={setEditPosterUrl}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Durum</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as MediaStatus)}
                className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500 outline-none text-sm"
              >
                <option value="planned">Planlandı</option>
                <option value="active">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
            
            {editStatus === 'completed' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Puan</label>
                <div className="bg-black/50 border border-green-900/50 p-2.5 rounded-2xl flex justify-center">
                  {renderStars(editRating, true, setEditRating)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => { setIsEditModalOpen(false); setSelectedItem(null); }}>
              İptal
            </Button>
            <Button type="submit" className="bg-green-600 text-stone-950 font-bold hover:bg-green-500">
              Güncelle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Simple loader helper
function Loader2({ size = 24, className = '' }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
