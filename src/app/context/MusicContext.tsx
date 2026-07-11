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
}

export const INITIAL_CHANNELS: Channel[] = [];

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
  isMusicPanelOpen: boolean;
  handleSelectChannel: (id: string) => void;
  handlePrevTrack: () => void;
  handleNextTrack: () => void;
  setIsMusicPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMusicSynced: React.Dispatch<React.SetStateAction<boolean>>;
  setVolume: (v: number) => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMusicPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  registerYTPlayer: (player: any) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const LS_KEY     = 'music-channels-v1';      // domain-agnostik yeni key
const LS_KEY_OLD = 'notefinder-channels-v1'; // eski key → migrate et

export function MusicProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(() => {
    // İlk yükleme: localStorage'dan hızlıca al (Supabase async olduğu için)
    if (typeof window === 'undefined') return INITIAL_CHANNELS;
    try {
      // Yeni key'i dene; yoksa eski key'den migrate et
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem(LS_KEY_OLD);
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        localStorage.setItem(LS_KEY, oldSaved); // yeni key'e kopyala
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
  const [volume, setVolume]                     = useState(1);
  const [isMuted, setIsMuted]                   = useState(false);
  const [isMusicPanelOpen, setIsMusicPanelOpen] = useState(false);

  // YouTube player referansı — HiddenYouTubePlayer tarafından doldurulur
  const ytPlayerRef = useRef<any>(null);
  // Supabase kaydetme için debounce timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          // localStorage'ı da güncelle (offline fallback)
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
    // İlk mount'ta (henüz Supabase yüklenmeden) boş array'i kaydetme
    // Bu, eski domain localStorage'ının üzerine yazmayı önler
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

  const isYTPlaylist = (src?: string | null) => !!src?.startsWith('yt-playlist:');

  const handleSelectChannel = (id: string) => {
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
    setCurrentTrackIndex(i => (i + 1) % activeChannel.tracks.length);
  };

  const addChannel = (channel: Channel) => setChannels(prev => [...prev, channel]);

  const removeChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    if (selectedChannelId === id) { setSelectedChannelId(null); setIsMusicPlaying(false); }
  };

  const registerYTPlayer = (player: any) => { ytPlayerRef.current = player; };

  return (
    <MusicContext.Provider value={{
      channels, selectedChannelId, isMusicPlaying, currentTrackIndex,
      isMusicSynced, volume, isMuted, activeChannel, activeTrack, isMusicPanelOpen,
      handleSelectChannel, handlePrevTrack, handleNextTrack,
      setIsMusicPlaying, setIsMusicSynced, setVolume, setIsMuted, setIsMusicPanelOpen,
      addChannel, removeChannel, registerYTPlayer,
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
