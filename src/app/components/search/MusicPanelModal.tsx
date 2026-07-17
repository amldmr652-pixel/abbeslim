'use client';

import { useState } from 'react';
import {
  X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Heart, Search, Moon, Shuffle, Repeat, Music, Plus, Trash2, Clock
} from 'lucide-react';
import { useMusicContext } from '@/app/context/MusicContext';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function MusicPanelModal() {
  const { t } = useTranslation();
  const {
    channels, selectedChannelId, isMusicPlaying, currentTrackIndex,
    isMusicSynced, volume, isMuted, activeChannel, activeTrack, isMusicPanelOpen,
    favoriteChannelIds, shuffleMode, repeatMode, currentSongTitle, currentSongArtist,
    currentTime, duration, sleepTimerRemaining,
    handleSelectChannel, handlePrevTrack, handleNextTrack,
    setIsMusicPlaying, setIsMusicSynced, setVolume, setIsMuted, setIsMusicPanelOpen,
    addChannel, removeChannel, toggleFavorite, seekTo, startSleepTimer, cancelSleepTimer,
    setShuffleMode, setRepeatMode
  } = useMusicContext();

  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('🎵');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  if (!isMusicPanelOpen) return null;

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
    let audioSrc = newChannelUrl.trim();
    let artist = 'Özel Liste';
    if (audioSrc.includes('list=')) {
      const match = audioSrc.match(/[?&]list=([^&\s]+)/);
      if (match) {
        audioSrc = 'yt-playlist:' + match[1];
        artist = 'YouTube Playlist';
      }
    }
    addChannel({
      id: newId,
      name: newChannelName.trim(),
      icon: newChannelIcon || '🎵',
      coverBg: audioSrc.startsWith('yt-playlist:') ? 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' : 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
      tracks: [{ title: newChannelName.trim(), artist, audioSrc }]
    });
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      {/* Outer panel container */}
      <div className="glass w-full max-w-[450px] rounded-[32px] p-6 relative animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(34,197,94,0.1)] bg-stone-950/95 border border-green-900/30 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => setIsMusicPanelOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Title area */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <Music size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">abbeslim.music</h2>
            <p className="text-[10px] text-gray-400 font-medium">Personal Focus Radio</p>
          </div>
        </div>

        {/* Advanced Player Section */}
        {selectedChannelId && activeChannel && activeTrack ? (
          <div className="bg-stone-900/50 border border-white/5 rounded-3xl p-5 mb-5 flex flex-col items-center">
            {/* Visual Cover Art */}
            <div 
              className={`w-36 h-36 rounded-full flex items-center justify-center text-5xl shadow-2xl relative mb-4 transition-transform duration-500 ${
                isMusicPlaying ? 'animate-spin [animation-duration:12s]' : 'scale-95'
              }`}
              style={{ background: activeChannel.coverBg }}
            >
              {activeChannel.icon}
              {/* Inner hole */}
              <div className="absolute w-8 h-8 rounded-full bg-stone-950 border border-white/10" />
            </div>

            {/* Song title and artist */}
            <div className="text-center w-full mb-3 px-4">
              <h3 className="text-sm font-bold text-white truncate">{currentSongTitle}</h3>
              <p className="text-xs text-gray-400 truncate mt-0.5">{currentSongArtist}</p>
            </div>

            {/* Seekbar */}
            <div className="w-full flex flex-col gap-1.5 px-2 mb-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-5 w-full">
              {/* Shuffle button */}
              <button
                onClick={() => setShuffleMode(s => !s)}
                className={`p-1.5 rounded-full transition-colors ${
                  shuffleMode ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
                }`}
                title="Karıştır"
              >
                <Shuffle size={16} />
              </button>

              {/* Prev button */}
              <button
                onClick={handlePrevTrack}
                className="text-gray-300 hover:text-white transition-colors p-1"
                title="Önceki"
              >
                <SkipBack size={18} />
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={() => setIsMusicPlaying(p => !p)}
                className="w-12 h-12 rounded-full bg-green-500 text-stone-950 flex items-center justify-center hover:scale-105 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                title={isMusicPlaying ? 'Duraklat' : 'Oynat'}
              >
                {isMusicPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>

              {/* Next button */}
              <button
                onClick={handleNextTrack}
                className="text-gray-300 hover:text-white transition-colors p-1"
                title="Sonraki"
              >
                <SkipForward size={18} />
              </button>

              {/* Repeat button */}
              <button
                onClick={cycleRepeatMode}
                className={`p-1.5 rounded-full transition-colors relative ${
                  repeatMode !== 'none' ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
                }`}
                title={`Tekrarla: ${repeatMode === 'none' ? 'Kapalı' : repeatMode === 'one' ? 'Tek Şarkı' : 'Tümü'}`}
              >
                <Repeat size={16} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-[8px] text-stone-950 font-bold rounded-full w-3 h-3 flex items-center justify-center">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Utility Buttons: Mute/Volume & Sleep Timer */}
            <div className="w-full flex items-center justify-between border-t border-white/5 mt-4 pt-4 px-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(v => !v)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
                  className="w-20 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                />
              </div>

              {/* Favorite & Sleep timer */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFavorite(activeChannel.id)}
                  className={`transition-colors ${
                    activeChannel.isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Favorilere Ekle"
                >
                  <Heart size={16} fill={activeChannel.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowSleepMenu(p => !p)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      sleepTimerRemaining !== null 
                        ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                        : 'bg-stone-800/50 text-gray-300 border-stone-700/50 hover:bg-stone-800'
                    }`}
                  >
                    <Clock size={12} />
                    {sleepTimerRemaining !== null ? `${Math.ceil(sleepTimerRemaining / 60)}m` : 'Sleep'}
                  </button>

                  {showSleepMenu && (
                    <div className="absolute right-0 bottom-full mb-2 bg-stone-900 border border-stone-800 rounded-2xl p-2 w-32 shadow-xl flex flex-col gap-1 z-50">
                      <button onClick={() => handleSleepSelect(15)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors">15 Dakika</button>
                      <button onClick={() => handleSleepSelect(30)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors">30 Dakika</button>
                      <button onClick={() => handleSleepSelect(45)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors">45 Dakika</button>
                      <button onClick={() => handleSleepSelect(60)} className="text-left text-xs text-gray-300 hover:text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors">60 Dakika</button>
                      {sleepTimerRemaining !== null && (
                        <button onClick={() => handleSleepSelect(null)} className="text-left text-xs text-red-400 hover:text-red-300 hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors border-t border-stone-800 mt-1">İptal Et</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-900/30 border border-white/5 rounded-3xl p-8 mb-5 text-center flex flex-col items-center gap-3">
            <span className="text-4xl text-gray-600 animate-pulse">📻</span>
            <p className="text-xs text-gray-400">Başlamak için listeden bir radyo/kanal seçin.</p>
          </div>
        )}

        {/* Sync panel */}
        <div className="flex items-center justify-between bg-stone-900/30 border border-white/5 rounded-2xl p-3 mb-4">
          <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
            ⏱️ {t('settings.actions.togglePomodoro') || 'Pomodoro ile Senkronize'}
          </span>
          <button
            onClick={() => setIsMusicSynced(v => !v)}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              isMusicSynced ? 'bg-green-500' : 'bg-stone-700'
            }`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
              isMusicSynced ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="relative mb-3 flex-shrink-0">
          <Search size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Kanallarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900/60 border border-stone-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Channels List Container */}
        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
          
          {/* Favorite Channels */}
          {favoriteChannels.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-1.5 px-1 flex items-center gap-1">
                <Heart size={10} fill="currentColor" /> Favori Radyolar
              </h4>
              <div className="space-y-1">
                {favoriteChannels.map(channel => renderChannelRow(channel))}
              </div>
            </div>
          )}

          {/* All / Regular Channels */}
          <div>
            {favoriteChannels.length > 0 && regularChannels.length > 0 && (
              <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5 px-1">Tüm Radyolar</h4>
            )}
            <div className="space-y-1">
              {regularChannels.map(channel => renderChannelRow(channel))}
            </div>
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-500">Kanal bulunamadı.</div>
          )}
        </div>

        {/* Ekleme ve Form */}
        <div className="border-t border-white/5 pt-4 mt-4">
          {!isAddingChannel ? (
            <button
              onClick={() => setIsAddingChannel(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs font-semibold text-green-400 hover:bg-stone-800 transition-colors"
            >
              <Plus size={14} /> Yeni Odak Listesi Ekle
            </button>
          ) : (
            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-white mb-1">Yeni Liste Oluştur</h3>
              <p className="text-[10px] text-gray-500 mb-3">YouTube playlist linki veya direkt MP3 URL&apos;i yapıştır</p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Liste Adı (Örn: Lofi Çalışma)"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="🎵"
                    value={newChannelIcon}
                    onChange={e => setNewChannelIcon(e.target.value)}
                    className="w-12 bg-stone-950 border border-stone-800 rounded-xl px-2 py-2 text-center text-lg text-white focus:outline-none focus:border-green-500"
                  />
                  <input
                    type="text"
                    placeholder="Playlist URL veya MP3 URL"
                    value={newChannelUrl}
                    onChange={e => setNewChannelUrl(e.target.value)}
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>

                {newChannelUrl.trim() && (
                  <div className={`text-[10px] p-2 rounded-lg border ${
                    newChannelUrl.includes('list=')
                      ? 'bg-green-950/20 text-green-400 border-green-500/20'
                      : 'bg-stone-950 text-gray-400 border-stone-800'
                  }`}>
                    {newChannelUrl.includes('list=')
                      ? '✓ YouTube Playlist algılandı'
                      : '✓ Direkt ses URL\'i algılandı'}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsAddingChannel(false);
                      setNewChannelName('');
                      setNewChannelUrl('');
                      setNewChannelIcon('🎵');
                    }}
                    className="flex-1 py-2 bg-stone-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-stone-700 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddChannelSubmit}
                    className="flex-1 py-2 bg-green-500 text-stone-950 rounded-xl text-xs font-bold hover:bg-green-400 transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  function renderChannelRow(channel: any) {
    const isSelected = selectedChannelId === channel.id;
    const isYTPlaylist = channel.tracks[0]?.audioSrc?.startsWith('yt-playlist:');

    return (
      <div
        key={channel.id}
        className={`group flex items-center justify-between p-2 rounded-2xl transition-all ${
          isSelected 
            ? 'bg-green-500/10 border-l-4 border-green-500' 
            : 'hover:bg-white/5 border-l-4 border-transparent'
        }`}
      >
        <div 
          onClick={() => handleSelectChannel(channel.id)} 
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: channel.coverBg }}
          >
            {channel.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-bold truncate ${isSelected ? 'text-green-400' : 'text-gray-200'}`}>
              {channel.name}
            </div>
            <div className="text-[10px] text-gray-500 truncate mt-0.5">
              {isYTPlaylist ? 'YouTube Playlist' : 'Direct Audio'}
            </div>
          </div>
        </div>

        {/* Favorite & Delete Actions */}
        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleFavorite(channel.id)}
            className={`p-1 hover:bg-white/5 rounded-lg transition-colors ${
              channel.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-white'
            }`}
            title={channel.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <Heart size={14} fill={channel.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => removeChannel(channel.id)}
            className="p-1 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            title="Kanalı Sil"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }
}
