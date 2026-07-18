'use client';

import { useEffect, useRef, useState } from 'react';
import { useMusicContext } from './context/MusicContext';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    _ytApiQueued: boolean;
  }
}

/**
 * Çift modlu ses oynatıcı:
 * 1. HTML5 Audio  → http(s):// ile başlayan MP3/stream URL'leri
 * 2. YouTube IFrame API → 'yt-playlist:PLAYLIST_ID' kaynakları
 *
 * YouTube modu: 200×113 px görünür boyutta ancak %1 opaklıkta tutulan gerçek player.
 * Bu boyutun altında YouTube autoplay politikasını devreye sokuyor ve ses gelmiyor.
 */
export default function HiddenYouTubePlayer() {
  const ctx = useMusicContext();
  const ctxRef = useRef(ctx);
  useEffect(() => { ctxRef.current = ctx; });

  // ── HTML5 Audio ──────────────────────────────────────────────
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const prevMp3Ref = useRef<string | null>(null);

  // ── YouTube IFrame API ────────────────────────────────────────
  const ytContainerRef = useRef<HTMLDivElement>(null); // Dış sarmalayicı (DOM'da kalır)
  const ytInnerRef     = useRef<HTMLDivElement>(null); // YouTube bu div'i iframe ile değiştirir
  const ytPlayerRef    = useRef<any>(null);
  const ytReadyRef     = useRef(false);
  const prevSrcRef     = useRef<string | null>(null);
  const lastErrorTimeRef = useRef<number>(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Yardımcılar
  const isYT  = (s?: string | null) => !!s?.startsWith('yt-playlist:') || !!s?.startsWith('yt-video:');
  const getYTParams = (s?: string | null) => {
    if (!s) return null;
    if (s.startsWith('yt-playlist:')) {
      return { type: 'playlist', id: s.replace('yt-playlist:', '') };
    }
    if (s.startsWith('yt-video:')) {
      return { type: 'video', id: s.replace('yt-video:', '') };
    }
    return null;
  };

  const currentSrc = ctx.activeTrack?.audioSrc ?? null;
  const ytMode     = isYT(currentSrc);

  // ─────────────────────────────────────────────────────────────
  // HTML5 Audio: element oluştur (bir kez)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      if (ctxRef.current.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio loop replay:', e));
      } else {
        ctxRef.current.handleNextTrack();
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!ctxRef.current.seekRequest) {
        ctxRef.current.updateProgress(audio.currentTime, audio.duration || 0);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      ctxRef.current.updateProgress(audio.currentTime, audio.duration || 0);
    });

    audio.addEventListener('playing', () => {
      ctxRef.current.setIsLoadingTrack(false);
    });

    return () => { audio.pause(); audio.src = ''; audioRef.current = null; };
  }, [mounted]);

  // HTML5 Audio: kaynak değişimi
  useEffect(() => {
    if (!mounted || ytMode || !audioRef.current || !currentSrc) return;
    if (currentSrc === prevMp3Ref.current) return;
    prevMp3Ref.current = currentSrc;
    audioRef.current.pause();
    audioRef.current.src = currentSrc;
    audioRef.current.load();
  }, [mounted, ytMode, currentSrc]);  // eslint-disable-line

  // HTML5 Audio: oynat / duraklat
  useEffect(() => {
    if (!mounted || ytMode || !audioRef.current) return;
    if (ctx.isMusicPlaying) {
      audioRef.current.play()
        .then(() => {
          ctxRef.current.setIsLoadingTrack(false);
        })
        .catch(e => console.warn('Audio play failed:', e));
    } else {
      audioRef.current.pause();
    }
  }, [mounted, ytMode, ctx.isMusicPlaying, currentSrc]);  // eslint-disable-line

  // HTML5 Audio: ses
  useEffect(() => {
    if (!mounted || ytMode || !audioRef.current) return;
    audioRef.current.volume = ctx.isMuted ? 0 : ctx.volume;
  }, [mounted, ytMode, ctx.volume, ctx.isMuted]);

  // ─────────────────────────────────────────────────────────────
  // YouTube IFrame API: script yükle (bir kez)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || window._ytApiQueued) return;
    window._ytApiQueued = true;
    const tag = document.createElement('script');
    tag.src   = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  }, [mounted]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
        ytPlayerRef.current = null;
        ytReadyRef.current  = false;
        ctxRef.current.registerYTPlayer(null);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // YouTube: playlist değişince player'ı güncelle veya oluştur
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !ytMode || !currentSrc) return;
    const params = getYTParams(currentSrc);
    if (!params) return;

    const rebuildPlayer = (pType: string, pId: string) => {
      if (!ytContainerRef.current) return;

      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
        ytPlayerRef.current = null;
      }

      // Recreate inner target div
      ytContainerRef.current.innerHTML = '';
      const newInnerDiv = document.createElement('div');
      newInnerDiv.style.width = '100%';
      newInnerDiv.style.height = '100%';
      ytContainerRef.current.appendChild(newInnerDiv);

      const playerVars: any = {
        autoplay   : 1,
        controls   : 0,
        rel        : 0,
        playsinline: 1,
        iv_load_policy: 3,
      };

      if (pType === 'playlist') {
        playerVars.listType = 'playlist';
        playerVars.list = pId;
      }

      const playerConfig: any = {
        width : 200,
        height: 113,
        playerVars,
        events: {
          onReady: (e: any) => {
            ytReadyRef.current = true;
            ctxRef.current.registerYTPlayer(ytPlayerRef.current);
            try {
              const iframe = e.target.getIframe() as HTMLElement;
              if (iframe) {
                iframe.style.setProperty('pointer-events', 'none', 'important');
                iframe.style.setProperty('z-index', '-9999', 'important');
              }
            } catch { /* ignore */ }
            const vol = ctxRef.current.isMuted ? 0 : Math.round(ctxRef.current.volume * 100);
            e.target.setVolume(vol);
            if (ctxRef.current.isMusicPlaying) e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              ctxRef.current.setIsLoadingTrack(false);
              try {
                const videoData = e.target.getVideoData();
                if (videoData?.title) {
                  ctxRef.current.updateSongInfo(videoData.title, videoData.author || '');
                }
              } catch {}

              // 500ms sonra tekrar al (YouTube API'nin eski şarkı adını dönme yarış koşulunu düzeltmek için)
              setTimeout(() => {
                try {
                  const videoData = e.target.getVideoData();
                  if (videoData?.title) {
                    ctxRef.current.updateSongInfo(videoData.title, videoData.author || '');
                  }
                } catch { /* ignore */ }
              }, 500);
            } else if (e.data === window.YT.PlayerState.BUFFERING) {
              ctxRef.current.setIsLoadingTrack(true);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              if (ctxRef.current.repeatMode === 'one') {
                e.target.seekTo(0, true);
                e.target.playVideo();
              } else {
                ctxRef.current.handleNextTrack();
              }
            }
          },
          onError: (e: any) => {
            console.warn('YT Error:', e.data);
            ctxRef.current.setIsLoadingTrack(false);
            
            const now = Date.now();
            if (now - lastErrorTimeRef.current < 4000) {
              console.warn('YT Error loop detected, stopping.');
              alert('Bu oynatma listesi veya video dış sitelerde oynatılamıyor (YouTube kısıtlaması nedeniyle).');
              return;
            }
            lastErrorTimeRef.current = now;
            ctxRef.current.handleNextTrack();
          },
        },
      };

      if (pType === 'video') {
        playerConfig.videoId = pId;
      }

      const instantiate = () => {
        ytPlayerRef.current = new window.YT.Player(newInnerDiv, playerConfig);
      };

      if (window.YT?.Player) {
        instantiate();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          instantiate();
        };
      }
    };

    // Kaynak değiştiyse player'ı her zaman sıfırdan oluştur
    // (loadPlaylist reuse bazı playlistlerde sessizce başarısız oluyor)
    if (currentSrc !== prevSrcRef.current) {
      prevSrcRef.current = currentSrc;
      ytReadyRef.current = false;
      rebuildPlayer(params.type, params.id);
    }
  }, [mounted, ytMode, currentSrc, ctx.selectedChannelId]);

  // Safety Timeout/Retry Guard
  useEffect(() => {
    if (!ctx.isLoadingTrack) return;

    const timer = setTimeout(() => {
      if (ctxRef.current.isLoadingTrack) {
        console.warn('Track loading state timed out after 15s, running safety recovery...');
        if (ytMode && ytPlayerRef.current && ytReadyRef.current) {
          try {
            const state = ytPlayerRef.current.getPlayerState?.();
            console.log('YT Player state during timeout check:', state);
            if (state === 3) {
              // It is buffering, let's give it more time and NOT skip
              console.log('YT Player is buffering, keeping loading state...');
              // Clear loading state after another 10s if still buffering, to hide the spinner
              setTimeout(() => {
                if (ctxRef.current.isLoadingTrack) {
                  const currentState = ytPlayerRef.current?.getPlayerState?.();
                  if (currentState !== 1) {
                    // Hâlâ çalmıyorsa bir kez daha dene
                    ytPlayerRef.current?.playVideo?.();
                  }
                  ctxRef.current.setIsLoadingTrack(false);
                }
              }, 10000);
              return;
            }
            if (state === 2 || state === 5 || state === -1) {
              console.log('YT Player is paused/cued/unstarted, attempting to playVideo...');
              ytPlayerRef.current.playVideo?.();
              
              // Give it another 3 seconds to transition to PLAYING before giving up
              setTimeout(() => {
                if (ctxRef.current.isLoadingTrack) {
                  const secondState = ytPlayerRef.current.getPlayerState?.();
                  if (secondState !== 1) {
                    console.warn('Still not playing after playVideo attempt, stopping loading state.');
                    ctxRef.current.setIsLoadingTrack(false);
                  }
                }
              }, 3000);
              return;
            }
          } catch (e) {
            console.warn('Error in safety player check:', e);
          }
        }
        
        // Default recovery: just stop the loading spinner, don't skip track
        console.log('Stopping loading state due to timeout.');
        ctxRef.current.setIsLoadingTrack(false);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [ctx.isLoadingTrack, ytMode]);

  // YouTube: oynat / duraklat (pauses YT if ytMode is false)
  useEffect(() => {
    if (!mounted || !ytReadyRef.current || !ytPlayerRef.current) return;
    if (!ytMode) {
      try { ytPlayerRef.current.pauseVideo?.(); } catch {}
      return;
    }
    ctx.isMusicPlaying
      ? ytPlayerRef.current.playVideo?.()
      : ytPlayerRef.current.pauseVideo?.();
  }, [mounted, ytMode, ctx.isMusicPlaying]);

  // YouTube: ses
  useEffect(() => {
    if (!mounted || !ytMode || !ytReadyRef.current || !ytPlayerRef.current) return;
    ytPlayerRef.current.setVolume?.(ctx.isMuted ? 0 : Math.round(ctx.volume * 100));
  }, [mounted, ytMode, ctx.volume, ctx.isMuted]);

  // Gelişmiş Özellikler: Seek listener
  useEffect(() => {
    if (!mounted || !ctx.seekRequest) return;
    const { time } = ctx.seekRequest;
    if (ytMode) {
      if (ytReadyRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo?.(time, true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    }
    ctx.clearSeekRequest();
  }, [mounted, ytMode, ctx.seekRequest]);

  // YouTube: progress check loop
  useEffect(() => {
    if (!mounted || !ytMode || !ctx.isMusicPlaying) return;
    const interval = setInterval(() => {
      if (ytReadyRef.current && ytPlayerRef.current) {
        try {
          const current = ytPlayerRef.current.getCurrentTime?.() || 0;
          const total = ytPlayerRef.current.getDuration?.() || 0;
          if (!ctxRef.current.seekRequest) {
            ctxRef.current.updateProgress(current, total);
          }

          // Polling ile şarkı adını kontrol et (Playlist otomatik şarkı geçişlerinde güncel ismi yakalamak için)
          const videoData = ytPlayerRef.current.getVideoData?.();
          if (videoData?.title && videoData.title !== ctxRef.current.currentSongTitle) {
            ctxRef.current.updateSongInfo(videoData.title, videoData.author || '');
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted, ytMode, ctx.isMusicPlaying, ctx.selectedChannelId, ctx.currentTrackIndex, ctx.currentSongTitle]);

  if (!mounted) return null;

  return (
    /**
     * Dış wrapper: pointer-events:none — YouTube'un iframe'i buraya yerlenir
     * ve wrapper'dan bu özelliği miras alır. Pomodoro butonu güvende.
     * İç div: YouTube bu div'i iframe ile değiştirir (DOM'dan kaldırır).
     */
    <div
      ref={ytContainerRef}
      style={{
        position    : 'fixed',
        top         : 0,
        left        : 0,
        width       : ytMode ? 200 : 0,
        height      : ytMode ? 113 : 0,
        opacity     : 0.01,
        overflow    : 'hidden',
        pointerEvents: 'none',   // ← wrapper'da kalır, iframe de dahil etkiler
        zIndex      : -9999,
      }}
    >
      <div
        ref={ytInnerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
