'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

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

export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'lofi-default', name: 'Lofi Hip Hop', icon: '🎵', coverBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', tracks: [{ title: 'Lofi Hip Hop Radio', artist: 'ChilledCow', audioSrc: 'yt-playlist:PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo' }] },
  { id: 'jazz-default', name: 'Jazz Chill', icon: '🎷', coverBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', tracks: [{ title: 'Jazz Radio', artist: 'Cafe Music BGM', audioSrc: 'yt-playlist:PLOzDu-MXXLlhEpXLsKv-zYgMFssl8qjBI' }] },
  { id: 'classical-default', name: 'Klasik Müzik', icon: '🎻', coverBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', tracks: [{ title: 'Classical Music', artist: 'Various', audioSrc: 'yt-playlist:PLVXcpYgR8su4cPp7U3BFLfGJMZOsvq6vn' }] },
  { id: 'rain-default', name: 'Yağmur Sesleri', icon: '🌧️', coverBg: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)', tracks: [{ title: 'Rain Sounds', artist: 'Nature', audioSrc: 'yt-playlist:PLOzDu-MXXLlhJawMCxqEfiBeSJR1G4vBy' }] },
  { id: 'nature-default', name: 'Doğa Sesleri', icon: '🌿', coverBg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', tracks: [{ title: 'Nature Sounds', artist: 'Nature', audioSrc: 'yt-playlist:PLOzDu-MXXLlhJCYpUMFH1eFsCGQJB_djE' }] },
];

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
  const [isMusicPlaying, setIsMusicPlaying]     = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicSynced, setIsMusicSynced]       = useState(true);
  
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

  const activeChannel = channels.find(c => c.id === selectedChannelId) ?? null;
  const activeTrack   = activeChannel ? activeChannel.tracks[currentTrackIndex] : null;

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
          setChannels(cloud);
          localStorage.setItem(LS_KEY, JSON.stringify(cloud));
        }
      } catch (e) {
        console.warn('Supabase kanal yükleme hatası:', e);
      } finally {
        supabaseLoadedRef.current = true;
      }
    };

    loadFromCloud();
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

  const isYTPlaylist = (src?: string | null) => !!src?.startsWith('yt-playlist:');

  const handleSelectChannel = (id: string) => {
    setIsLoadingTrack(true);
    setSelectedChannelId(id);
    setCurrentTrackIndex(0);
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
      setShuffleMode, setRepeatMode, clearSeekRequest
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusicContext must be used within a MusicProvider');
  return ctx;
}
