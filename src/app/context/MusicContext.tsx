'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { enableBackgroundMode, disableBackgroundMode } from '@/utils/backgroundMode';

export interface Track {
  title: string;
  artist: string;
  audioSrc: string; // 'yt-playlist:PL...' veya direkt MP3/stream URL
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  coverBg: string;
  tracks: Track[];
  isFavorite?: boolean;
}

export interface LikedSong {
  id: string;
  video_id: string;
  title: string;
  artist: string;
  channel_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export const DEFAULT_CHANNELS: Channel[] = [];

export const INITIAL_CHANNELS: Channel[] = DEFAULT_CHANNELS;

interface MusicContextType {
  channels: Channel[];
  selectedChannelId: string | null;
  isMusicPlaying: boolean;
  currentTrackIndex: number;
  isMusicSynced: boolean;
  volume: number;
  isMuted: boolean;
  activeChannel: Channel | null;
  activeTrack: Track | null;
  
  // Spotify / Gelişmiş Özellikler
  favoriteChannelIds: string[];
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
  currentSongTitle: string;
  currentSongArtist: string;
  currentTime: number;
  duration: number;
  sleepTimerRemaining: number | null;
  seekRequest: { time: number; timestamp: number } | null;
  isLoadingTrack: boolean;
  setIsLoadingTrack: (loading: boolean) => void;

  handleSelectChannel: (id: string) => void;
  handlePrevTrack: () => void;
  handleNextTrack: () => void;
  setIsMusicPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMusicSynced: React.Dispatch<React.SetStateAction<boolean>>;
  setVolume: (v: number) => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  registerYTPlayer: (player: any) => void;
  
  // Spotify / Gelişmiş Fonksiyonlar
  toggleFavorite: (channelId: string) => void;
  seekTo: (time: number) => void;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  updateSongInfo: (title: string, artist: string) => void;
  updateProgress: (current: number, total: number) => void;
  setShuffleMode: React.Dispatch<React.SetStateAction<boolean>>;
  setRepeatMode: React.Dispatch<React.SetStateAction<'none' | 'one' | 'all'>>;
  clearSeekRequest: () => void;

  // Şarkı favori sistemi
  likedSongs: LikedSong[];
  isCurrentSongLiked: boolean;
  toggleLikeSong: () => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  playDirectVideo: (videoId: string, title: string, artist: string) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const LS_KEY     = 'music-channels-v2';      // v2 key for newer schema
const LS_KEY_OLD = 'music-channels-v1';      // old key to migrate

export function MusicProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CHANNELS;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem(LS_KEY_OLD);
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        localStorage.setItem(LS_KEY, oldSaved);
        return parsed;
      }
      return INITIAL_CHANNELS;
    } catch {
      return INITIAL_CHANNELS;
    }
  });

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [directVideo, setDirectVideo] = useState<{ videoId: string; title: string; artist: string } | null>(null);
  const [isMusicPlaying, setIsMusicPlaying]     = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicSynced, setIsMusicSynced]       = useState(true);

  const activeChannel = directVideo
    ? null
    : (channels.find(c => c.id === selectedChannelId) ?? null);

  const activeTrack: Track | null = directVideo
    ? { title: directVideo.title, artist: directVideo.artist, audioSrc: `yt-video:${directVideo.videoId}` }
    : (activeChannel ? activeChannel.tracks[currentTrackIndex] : null);
  
  // Persisted volume state
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.7;
    try {
      const saved = localStorage.getItem('music-volume');
      return saved ? parseFloat(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music-volume', String(v));
    }
  };

  const [isMuted, setIsMuted]                   = useState(false);

  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [currentSongTitle, setCurrentSongTitle] = useState('');
  const [currentSongArtist, setCurrentSongArtist] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ time: number; timestamp: number } | null>(null);

  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);

  const getCurrentVideoId = (): string | null => {
    try {
      const player = ytPlayerRef.current;
      if (player && typeof player.getVideoUrl === 'function') {
        const url = player.getVideoUrl();
        const match = url?.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
      }
    } catch {}
    
    if (activeTrack?.audioSrc && activeTrack.audioSrc.startsWith('yt-video:')) {
      return activeTrack.audioSrc.replace('yt-video:', '');
    }
    
    return null;
  };

  const currentVideoId = getCurrentVideoId();
  const isCurrentSongLiked = currentVideoId ? likedSongs.some(s => s.video_id === currentVideoId) : false;

  const fetchLikedSongs = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLikedSongs(data);
      }
    } catch (e) {
      console.warn('Beğenilen şarkılar yüklenemedi:', e);
    }
  };

  const toggleLikeSong = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const videoId = getCurrentVideoId();
      if (!videoId) return;

      const existing = likedSongs.find(s => s.video_id === videoId);

      if (existing) {
        await supabase.from('liked_songs').delete().eq('id', existing.id);
        setLikedSongs(prev => prev.filter(s => s.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from('liked_songs')
          .insert({
            user_id: user.id,
            video_id: videoId,
            title: currentSongTitle || activeTrack?.title || 'Bilinmeyen Şarkı',
            artist: currentSongArtist || activeChannel?.name || '',
            channel_id: activeChannel?.id || null,
            thumbnail_url: null,
          })
          .select()
          .single();

        if (!error && data) {
          setLikedSongs(prev => [data, ...prev]);
        }
      }
    } catch (e) {
      console.warn('Şarkı beğenme hatası:', e);
    }
  };

  const favoriteChannelIds = channels.filter(c => c.isFavorite).map(c => c.id);

  // YouTube player referansı
  const ytPlayerRef = useRef<any>(null);
  const lastActiveTrackIdRef = useRef<string | null>(null);
  // Supabase kaydetme için debounce timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // İlk Supabase yüklemesi tamamlandı mı
  const supabaseLoadedRef = useRef(false);
  // İlk render geçti mi (mount sonrası save'i engelle)
  const initialLoadDoneRef = useRef(false);

  // ── Arka plan müzik: Native audio fallback ──
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [nativeAudioUrl, setNativeAudioUrl] = useState<string | null>(null);
  const nativeAudioActiveRef = useRef(false); // Arka planda native audio aktif mi

  // ── Supabase: sayfa açılınca kullanıcının kanallarını yükle ──
  useEffect(() => {
    const loadFromCloud = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Giriş yapılmamışsa localStorage yeterli

        const { data, error } = await supabase
          .from('user_channels')
          .select('channels_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) { console.warn('Kanal yüklenemedi:', error.message); return; }

        if (data?.channels_data) {
          const cloud: Channel[] = data.channels_data;
          const mergedMap = new Map<string, Channel>();
          DEFAULT_CHANNELS.forEach(c => mergedMap.set(c.id, c));
          cloud.forEach(c => mergedMap.set(c.id, c));
          const merged = Array.from(mergedMap.values());
          setChannels(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
        }
      } catch (e) {
        console.warn('Supabase kanal yükleme hatası:', e);
      } finally {
        supabaseLoadedRef.current = true;
      }
    };

    loadFromCloud();
    fetchLikedSongs();
  }, []);

  // ── Supabase + localStorage: kanallar değişince kaydet (debounced) ──
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      return;
    }

    localStorage.setItem(LS_KEY, JSON.stringify(channels));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_channels')
          .upsert(
            { user_id: user.id, channels_data: channels, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
      } catch (e) {
        console.warn('Supabase kanal kaydetme hatası:', e);
      }
    }, 800); // 800ms debounce
  }, [channels]);

  // Song info auto fallback
  useEffect(() => {
    if (activeTrack) {
      const trackId = `${activeTrack.audioSrc}::${activeTrack.title}`;
      if (lastActiveTrackIdRef.current !== trackId) {
        lastActiveTrackIdRef.current = trackId;
        setCurrentSongTitle(activeTrack.title);
        setCurrentSongArtist(activeTrack.artist || activeChannel?.name || 'Sanatçı');
      }
    } else {
      lastActiveTrackIdRef.current = null;
      setCurrentSongTitle('');
      setCurrentSongArtist('');
    }
  }, [activeTrack, activeChannel]);

  // MediaSession API — Arka planda müzik çalma ve kilit ekranı/bildirim kontrolleri
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (isMusicPlaying && currentSongTitle) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSongTitle,
        artist: currentSongArtist || 'abbeslim.',
        album: activeChannel?.name || 'Odak Müzikleri',
        artwork: [
          { src: '/favicon.ico', sizes: '96x96', type: 'image/png' },
        ]
      });

      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => setIsMusicPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsMusicPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack());
    } else {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, [isMusicPlaying, currentSongTitle, currentSongArtist, activeChannel]);

  // Sayfa tekrar görünür olduğunda müziği otomatik devam ettir (YouTube player auto-resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMusicPlaying) {
        try {
          const player = ytPlayerRef.current;
          if (player && typeof player.getPlayerState === 'function') {
            const state = player.getPlayerState();
            // 2 = paused (YouTube tarafında arka planda kalındığı için durdurulduysa)
            if (state === 2) {
              player.playVideo();
            }
          }
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMusicPlaying]);

  // Arka planda tarayıcının meşgul kalmasını sağlamak için sessiz AudioContext keepalive
  useEffect(() => {
    if (!isMusicPlaying || typeof window === 'undefined') return;

    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.0001; // Duyulamayacak derecede sessiz
      gainNode.connect(audioCtx.destination);
      oscillator = audioCtx.createOscillator();
      oscillator.connect(gainNode);
      oscillator.start();
    } catch {}

    return () => {
      try {
        oscillator?.stop();
        audioCtx?.close();
      } catch {}
    };
  }, [isMusicPlaying]);

  // ── Arka plan müzik: Video değiştiğinde Invidious'tan direkt audio URL al ──
  const fetchNativeAudioUrl = useCallback(async (videoId: string) => {
    try {
      const res = await fetch(`/api/music/stream?videoId=${videoId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.audioUrl) {
        setNativeAudioUrl(data.audioUrl);
      }
    } catch (e) {
      console.warn('[NativeAudio] Stream URL alınamadı:', e);
    }
  }, []);

  // Video ID değiştiğinde native audio URL'ini güncelle
  useEffect(() => {
    const videoId = getCurrentVideoId();
    if (videoId && isMusicPlaying) {
      fetchNativeAudioUrl(videoId);
    } else {
      setNativeAudioUrl(null);
    }
  }, [currentSongTitle, isMusicPlaying, directVideo, selectedChannelId, currentTrackIndex]);

  // ── Arka plan müzik: Visibility change handler — ön plan / arka plan geçişi ──
  useEffect(() => {
    const handleBgSwitch = () => {
      const audio = nativeAudioRef.current;
      if (!audio || !nativeAudioUrl) return;

      if (document.visibilityState === 'hidden' && isMusicPlaying) {
        // Arka plana geçildi — native audio'yu duyulur yap, YouTube zaten duracak
        audio.src = nativeAudioUrl;
        audio.volume = volume;
        audio.play().catch(() => {});
        nativeAudioActiveRef.current = true;
      } else if (document.visibilityState === 'visible') {
        // Ön plana dönüldü — native audio sessiz, YouTube devam
        if (nativeAudioActiveRef.current) {
          audio.pause();
          audio.removeAttribute('src');
          nativeAudioActiveRef.current = false;
          // YouTube player'ı resume et
          try {
            const player = ytPlayerRef.current;
            if (player && typeof player.playVideo === 'function') {
              player.playVideo();
            }
          } catch {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleBgSwitch);
    return () => document.removeEventListener('visibilitychange', handleBgSwitch);
  }, [isMusicPlaying, nativeAudioUrl, volume]);

  // ── Arka plan müzik: Native audio volume sync ──
  useEffect(() => {
    const audio = nativeAudioRef.current;
    if (audio && nativeAudioActiveRef.current) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // ── Arka plan müzik: Müzik durdurulduğunda native audio'yu da durdur ──
  useEffect(() => {
    if (!isMusicPlaying) {
      const audio = nativeAudioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        nativeAudioActiveRef.current = false;
      }
    }
  }, [isMusicPlaying]);

  // ── Capacitor: Müzik çalarken background mode etkinleştir ──
  useEffect(() => {
    if (isMusicPlaying) {
      enableBackgroundMode();
    } else {
      disableBackgroundMode();
    }
  }, [isMusicPlaying]);

  const isYTPlaylist = (src?: string | null) => !!src?.startsWith('yt-playlist:') || !!src?.startsWith('yt-video:');

  const handleSelectChannel = (id: string) => {
    setDirectVideo(null);
    setIsLoadingTrack(true);
    setSelectedChannelId(id);
    setCurrentTrackIndex(0);
    setIsMusicPlaying(true);
  };

  const playDirectVideo = (videoId: string, title: string, artist: string) => {
    setIsLoadingTrack(true);
    setDirectVideo({ videoId, title, artist });
    setSelectedChannelId(null);
    setCurrentSongTitle(title);
    setCurrentSongArtist(artist);
    setIsMusicPlaying(true);
  };

  const handlePrevTrack = () => {
    if (!activeChannel) return;
    if (isYTPlaylist(activeTrack?.audioSrc)) { ytPlayerRef.current?.previousVideo?.(); return; }
    setCurrentTrackIndex(i => (i - 1 + activeChannel.tracks.length) % activeChannel.tracks.length);
  };

  const handleNextTrack = () => {
    if (!activeChannel) return;
    if (isYTPlaylist(activeTrack?.audioSrc)) { ytPlayerRef.current?.nextVideo?.(); return; }
    if (shuffleMode && activeChannel.tracks.length > 1) {
      let rand = currentTrackIndex;
      while (rand === currentTrackIndex) {
        rand = Math.floor(Math.random() * activeChannel.tracks.length);
      }
      setCurrentTrackIndex(rand);
      return;
    }
    setCurrentTrackIndex(i => (i + 1) % activeChannel.tracks.length);
  };

  const addChannel = (channel: Channel) => setChannels(prev => [...prev, channel]);

  const removeChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    if (selectedChannelId === id) { setSelectedChannelId(null); setIsMusicPlaying(false); }
  };

  const registerYTPlayer = (player: any) => { ytPlayerRef.current = player; };

  // Spotify / Gelişmiş Fonksiyonlar
  const toggleFavorite = (channelId: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const seekTo = (time: number) => {
    setSeekRequest({ time, timestamp: Date.now() });
  };

  const clearSeekRequest = () => {
    setSeekRequest(null);
  };

  const startSleepTimer = (minutes: number) => {
    if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    setSleepTimerRemaining(minutes * 60);
    sleepTimerIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
          setIsMusicPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }
    setSleepTimerRemaining(null);
  };

  const updateSongInfo = (title: string, artist: string) => {
    setCurrentSongTitle(title);
    setCurrentSongArtist(artist);
  };

  const updateProgress = (current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  };

  // Clean up sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, []);
  return (
    <MusicContext.Provider value={{
      channels, selectedChannelId, isMusicPlaying, currentTrackIndex,
      isMusicSynced, volume, isMuted, activeChannel, activeTrack,
      favoriteChannelIds, shuffleMode, repeatMode, currentSongTitle, currentSongArtist,
      currentTime, duration, sleepTimerRemaining, seekRequest,
      isLoadingTrack, setIsLoadingTrack,
      handleSelectChannel, handlePrevTrack, handleNextTrack,
      setIsMusicPlaying, setIsMusicSynced, setVolume, setIsMuted,
      addChannel, removeChannel, registerYTPlayer,
      toggleFavorite, seekTo, startSleepTimer, cancelSleepTimer, updateSongInfo, updateProgress,
      setShuffleMode, setRepeatMode, clearSeekRequest,
      likedSongs, isCurrentSongLiked, toggleLikeSong, fetchLikedSongs, playDirectVideo
    }}>
      {/* Arka plan müzik: gizli native audio elementi */}
      <audio ref={nativeAudioRef} preload="none" style={{ display: 'none' }} />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicContext must be used within a MusicProvider');
  return ctx;
}
