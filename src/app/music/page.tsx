'use client';

import { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Heart, Search, Shuffle, Repeat, Music, Plus, Trash2, Clock, AlertCircle
} from 'lucide-react';
import { useMusicContext } from '@/app/context/MusicContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Card, Button, Input } from '@/app/components/ui';
import { createClient } from '@/utils/supabase/client';

export default function MusicPage() {
  const { t } = useTranslation();
  const {
    channels, selectedChannelId, isMusicPlaying, currentTrackIndex,
    isMusicSynced, volume, isMuted, activeChannel, activeTrack,
    favoriteChannelIds, shuffleMode, repeatMode, currentSongTitle, currentSongArtist,
    currentTime, duration, sleepTimerRemaining, isLoadingTrack,
    handleSelectChannel, handlePrevTrack, handleNextTrack,
    setIsMusicPlaying, setIsMusicSynced, setVolume, setIsMuted,
    addChannel, removeChannel, toggleFavorite, seekTo, startSleepTimer, cancelSleepTimer,
    setShuffleMode, setRepeatMode,
    likedSongs, isCurrentSongLiked, toggleLikeSong, fetchLikedSongs, playDirectVideo
  } = useMusicContext();

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('🎵');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoadingUser(false);
    };
    checkUser();
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-green-500"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <AlertCircle size={48} className="text-yellow-500 mb-4 mx-auto" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Yapmanız Gerekiyor'}</h2>
        <p className="text-gray-400">Müzik dinlemek için lütfen giriş yapın.</p>
      </div>
    );
  }

  // Filter channels
  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const favoriteChannels = filteredChannels.filter(c => c.isFavorite);
  const regularChannels = filteredChannels.filter(c => !c.isFavorite);

  // Time Formatter
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAddChannelSubmit = () => {
    if (!newChannelName.trim() || !newChannelUrl.trim()) {
      alert('Liste adı ve URL zorunludur.');
      return;
    }
    const newId = 'custom-' + Date.now();
    let audioSrc = newChannelUrl.trim()
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
      .replace(/[&?]si=[^&\s]*/g, '');
    let artist = 'Özel Liste';
    
    if (audioSrc.includes('list=')) {
      const match = audioSrc.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (match) {
        audioSrc = 'yt-playlist:' + match[1];
        artist = 'YouTube Playlist';
      }
    } else if (audioSrc.includes('v=') || audioSrc.includes('youtu.be/')) {
      let videoId = '';
      if (audioSrc.includes('v=')) {
        const match = audioSrc.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
      } else {
        const match = audioSrc.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
      }
      if (videoId) {
        audioSrc = 'yt-video:' + videoId;
        artist = 'YouTube Video';
      }
    }

    addChannel({
      id: newId,
      name: newChannelName.trim(),
      icon: newChannelIcon || '🎵',
      coverBg: (audioSrc.startsWith('yt-playlist:') || audioSrc.startsWith('yt-video:'))
        ? 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' 
        : 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
      tracks: [{ title: newChannelName.trim(), artist, audioSrc }]
    });
    
    handleSelectChannel(newId);
    setIsAddingChannel(false);
    setNewChannelName('');
    setNewChannelUrl('');
    setNewChannelIcon('🎵');
  };

  const handleSleepSelect = (mins: number | null) => {
    if (mins === null) {
      cancelSleepTimer();
    } else {
      startSleepTimer(mins);
    }
    setShowSleepMenu(false);
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
          <Music size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Odak Müzik</h1>
          <p className="text-gray-400 text-sm">Çalışırken odaklanmanı sağlayacak kişisel radyolar ve oynatma listeleri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Sütun: Player Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card padding="lg" glow={isMusicPlaying}>
            {selectedChannelId && activeChannel && activeTrack ? (
              <div className="flex flex-col items-center py-6">
                {/* Visual Cover Art */}
                <div 
                  className={`w-64 h-64 rounded-full flex items-center justify-center text-8xl shadow-2xl relative mb-8 transition-transform duration-500 border border-white/10 ${
                    isMusicPlaying ? 'animate-spin [animation-duration:15s]' : 'scale-95'
                  }`}
                  style={{ background: activeChannel.coverBg }}
                >
                  {activeChannel.icon}
                  {/* Inner vinyl record hole */}
                  <div className="absolute w-16 h-16 rounded-full bg-stone-950 border border-white/10 shadow-inner flex items-center justify-center">
                    {isLoadingTrack ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-stone-900" />
                    )}
                  </div>
                </div>

                {/* Song title and artist */}
                <div className="text-center w-full mb-6 px-6">
                  <h3 className="text-xl font-bold text-white truncate max-w-lg mx-auto">{currentSongTitle}</h3>
                  <p className="text-sm text-gray-400 truncate mt-1">{currentSongArtist}</p>
                </div>

                {/* Seekbar */}
                <div className="w-full flex flex-col gap-2 px-6 mb-6">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-6 w-full mb-6">
                  {/* Shuffle button */}
                  <button
                    onClick={() => setShuffleMode(s => !s)}
                    className={`p-2.5 rounded-full hover:bg-white/5 transition-all ${
                      shuffleMode ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
                    }`}
                    title="Karıştır"
                  >
                    <Shuffle size={20} />
                  </button>

                  {/* Prev button */}
                  <button
                    onClick={handlePrevTrack}
                    className="text-gray-300 hover:text-white hover:bg-white/5 p-2.5 rounded-full transition-all"
                    title="Önceki"
                  >
                    <SkipBack size={24} />
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsMusicPlaying(p => !p)}
                    className="w-16 h-16 rounded-full bg-green-500 text-stone-950 flex items-center justify-center hover:scale-105 hover:bg-green-400 transition-all shadow-xl shadow-green-500/20"
                    title={isMusicPlaying ? 'Duraklat' : 'Oynat'}
                  >
                    {isLoadingTrack ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-950 border-t-transparent" />
                    ) : isMusicPlaying ? (
                      <Pause size={28} fill="currentColor" />
                    ) : (
                      <Play size={28} fill="currentColor" className="ml-1" />
                    )}
                  </button>

                  {/* Next button */}
                  <button
                    onClick={handleNextTrack}
                    className="text-gray-300 hover:text-white hover:bg-white/5 p-2.5 rounded-full transition-all"
                    title="Sonraki"
                  >
                    <SkipForward size={24} />
                  </button>

                  {/* Repeat button */}
                  <button
                    onClick={cycleRepeatMode}
                    className={`p-2.5 rounded-full hover:bg-white/5 transition-all relative ${
                      repeatMode !== 'none' ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
                    }`}
                    title={`Tekrarla: ${repeatMode === 'none' ? 'Kapalı' : repeatMode === 'one' ? 'Tek Şarkı' : 'Tümü'}`}
                  >
                    <Repeat size={20} />
                    {repeatMode === 'one' && (
                      <span className="absolute top-1.5 right-1.5 bg-green-500 text-[8px] text-stone-950 font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        1
                      </span>
                    )}
                  </button>
                </div>

                {/* Utility Buttons: Mute/Volume & Sleep Timer */}
                <div className="w-full flex items-center justify-between border-t border-white/5 pt-5 px-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMuted(v => !v)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title={isMuted ? 'Sesi Aç' : 'Sesi Kıs'}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        setVolume(parseFloat(e.target.value));
                      }}
                      className="w-28 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                    />
                  </div>

                  {/* Favorite & Sleep timer */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLikeSong()}
                      className={`p-2 rounded-full hover:bg-white/5 transition-all ${
                        isCurrentSongLiked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                      }`}
                      title={isCurrentSongLiked ? 'Beğeniyi Kaldır' : 'Şarkıyı Beğen'}
                    >
                      <Heart size={20} fill={isCurrentSongLiked ? 'currentColor' : 'none'} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowSleepMenu(p => !p)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                          sleepTimerRemaining !== null 
                            ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                            : 'bg-stone-800/50 text-gray-300 border-stone-700/50 hover:bg-stone-800'
                        }`}
                      >
                        <Clock size={14} />
                        {sleepTimerRemaining !== null ? `${Math.ceil(sleepTimerRemaining / 60)} dk` : 'Zamanlayıcı'}
                      </button>

                      {showSleepMenu && (
                        <div className="absolute right-0 bottom-full mb-2 bg-stone-900 border border-stone-800 rounded-2xl p-2 w-36 shadow-xl flex flex-col gap-1 z-50">
                          <button onClick={() => handleSleepSelect(15)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-2 rounded-lg transition-colors">15 Dakika</button>
                          <button onClick={() => handleSleepSelect(30)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-2 rounded-lg transition-colors">30 Dakika</button>
                          <button onClick={() => handleSleepSelect(45)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-2 rounded-lg transition-colors">45 Dakika</button>
                          <button onClick={() => handleSleepSelect(60)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-2 rounded-lg transition-colors">60 Dakika</button>
                          {sleepTimerRemaining !== null && (
                            <button onClick={() => handleSleepSelect(null)} className="text-left text-xs text-red-400 hover:text-red-300 hover:bg-stone-800 px-3 py-2 rounded-lg transition-colors border-t border-stone-800 mt-1">İptal Et</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <span className="text-6xl text-gray-600 animate-pulse">📻</span>
                <p className="text-gray-400">Başlamak için sağdaki listeden bir radyo veya kanal seçin.</p>
              </div>
            )}
          </Card>

          {/* Sync panel */}
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Pomodoro ile Senkronizasyon</span>
                <span className="text-xs text-gray-500">Sayaç başladığında müzik çalar otomatik başlar, mola bittiğinde durur.</span>
              </div>
              <button
                onClick={() => setIsMusicSynced(v => !v)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  isMusicSynced ? 'bg-green-500' : 'bg-stone-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all ${
                  isMusicSynced ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Sağ Sütun: Radyo Kanalları Listesi */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card padding="lg" className="flex flex-col max-h-[580px]">
            {/* Search */}
            <div className="relative mb-4 flex-shrink-0">
              <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Radyolarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Channels Scroll Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
              {/* Beğenilen Şarkılar */}
              {likedSongs.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-red-500 font-bold mb-3 px-1 flex items-center gap-1.5">
                    <Music size={12} /> Beğenilen Şarkılar
                  </h4>
                  <div className="space-y-2 mb-4">
                    {likedSongs.slice(0, 10).map(song => (
                      <div
                        key={song.id}
                        onClick={() => playDirectVideo(song.video_id, song.title, song.artist)}
                        className="glass p-2.5 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-green-500/30 hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <Music size={14} className="text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const supabase = createClient();
                            await supabase.from('liked_songs').delete().eq('id', song.id);
                            fetchLikedSongs();
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Beğeniyi Kaldır"
                        >
                          <Heart size={14} fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Channels */}
              {favoriteChannels.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-red-400 font-bold mb-3 px-1 flex items-center gap-1.5">
                    <Heart size={12} fill="currentColor" /> Favori Radyolar
                  </h4>
                  <div className="space-y-2">
                    {favoriteChannels.map(channel => renderChannelRow(channel))}
                  </div>
                </div>
              )}

              {/* All / Regular Channels */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3 px-1">
                  {favoriteChannels.length > 0 ? 'Tüm Radyolar' : 'Radyo Kanalları'}
                </h4>
                <div className="space-y-2">
                  {regularChannels.map(channel => renderChannelRow(channel))}
                </div>
              </div>

              {filteredChannels.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-500">Kanal bulunamadı.</div>
              )}
            </div>

            {/* Add Channel Button/Form */}
            <div className="border-t border-white/5 pt-4 mt-4 flex-shrink-0">
              {!isAddingChannel ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsAddingChannel(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-semibold"
                >
                  <Plus size={16} /> Yeni Odak Listesi Ekle
                </Button>
              ) : (
                <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Yeni Liste Oluştur</h3>
                    <p className="text-[10px] text-gray-500">YouTube playlist linki veya direkt MP3 URL&apos;i yapıştırın.</p>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Liste Adı (Örn: Lofi Çalışma)"
                      value={newChannelName}
                      onChange={val => setNewChannelName(val)}
                      className="text-xs"
                    />

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Icon (Örn: 🎵)"
                        value={newChannelIcon}
                        onChange={e => setNewChannelIcon(e.target.value)}
                        className="w-16 bg-stone-900 border border-stone-800 rounded-2xl px-2 py-2 text-center text-xl text-white focus:outline-none focus:border-green-500"
                      />
                      <Input
                        placeholder="Playlist veya MP3 URL"
                        value={newChannelUrl}
                        onChange={val => setNewChannelUrl(val)}
                        className="flex-1 text-xs"
                      />
                    </div>

                    {newChannelUrl.trim() && (
                      <div className="space-y-1.5">
                        <div className={`text-[10px] p-2 rounded-lg border ${
                          (newChannelUrl.includes('list=') || newChannelUrl.includes('v=') || newChannelUrl.includes('youtu.be/'))
                            ? 'bg-green-950/20 text-green-400 border-green-500/20'
                            : 'bg-stone-900/50 text-gray-400 border-stone-800/30'
                        }`}>
                          {newChannelUrl.includes('list=')
                            ? '✓ YouTube Playlist algılandı'
                            : (newChannelUrl.includes('v=') || newChannelUrl.includes('youtu.be/'))
                              ? '✓ YouTube Videosu algılandı'
                              : '✓ Direkt ses URL\'i algılandı'}
                        </div>
                        {newChannelUrl.includes('list=') && (
                          <p className="text-[9px] text-yellow-500/80 leading-relaxed px-1">
                            ⚠️ YouTube Mix (RD...) ve Beğenilen Videolar (LL) gibi kişisel/dinamik listeler veya gizli oynatma listeleri YouTube API tarafından engellendiği için oynatılamaz. Listenin gizliliği &quot;Herkese Açık&quot; veya &quot;Liste Dışı&quot; olmalıdır.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsAddingChannel(false);
                          setNewChannelName('');
                          setNewChannelUrl('');
                          setNewChannelIcon('🎵');
                        }}
                        className="flex-1 text-xs"
                      >
                        İptal
                      </Button>
                      <Button
                        onClick={handleAddChannelSubmit}
                        className="flex-1 text-xs"
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  function renderChannelRow(channel: any) {
    const isSelected = selectedChannelId === channel.id;
    const isYTPlaylist = channel.tracks[0]?.audioSrc?.startsWith('yt-playlist:');
    const isYTVideo = channel.tracks[0]?.audioSrc?.startsWith('yt-video:');
    const isYT = isYTPlaylist || isYTVideo;

    return (
      <div
        key={channel.id}
        className={`group flex items-center justify-between p-3 rounded-2xl transition-all ${
          isSelected 
            ? 'bg-green-500/10 border-l-4 border-green-500' 
            : 'hover:bg-white/5 border-l-4 border-transparent'
        }`}
      >
        <div 
          onClick={() => handleSelectChannel(channel.id)} 
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
            style={{ background: channel.coverBg }}
          >
            {isSelected && isLoadingTrack && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
              </div>
            )}
            {channel.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-bold truncate ${isSelected ? 'text-green-400' : 'text-gray-200'}`}>
              {channel.name}
            </div>
            <div className="text-xs text-gray-500 truncate mt-1">
              {isYTPlaylist ? 'YouTube Oynatma Listesi' : isYTVideo ? 'YouTube Videosu' : 'Direkt Ses Yayını'}
            </div>
          </div>
        </div>

        {/* Favorite & Delete Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleFavorite(channel.id)}
            className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${
              channel.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-white'
            }`}
            title={channel.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <Heart size={16} fill={channel.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => removeChannel(channel.id)}
            className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            title="Kanalı Sil"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }
}
