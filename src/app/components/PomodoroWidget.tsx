'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMusicContext } from '../context/MusicContext';

const defaultSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 3,
  autoStartBreaks: true,
  autoStartPomodoros: false,
};

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODE_LABELS: Record<Mode, string> = {
  pomodoro: 'Odaklanma Süresi',
  shortBreak: 'Kısa Mola',
  longBreak: 'Uzun Mola',
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <span>🔇</span>;
  if (volume < 0.4) return <span>🔈</span>;
  if (volume < 0.7) return <span>🔉</span>;
  return <span>🔊</span>;
}

export default function PomodoroWidget({ onOpenMusicPanel }: { onOpenMusicPanel?: () => void }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Music Context
  const {
    isMusicSynced,
    selectedChannelId,
    setIsMusicPlaying,
    isMusicPlaying,
    activeChannel,
    activeTrack,
    handlePrevTrack,
    handleNextTrack,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  } = useMusicContext();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Callback referansları (kapanış senkronizasyon hatasını ve state uyumsuzluğunu önler)
  const handleFinishRef = useRef<(() => void) | null>(null);
  const startTimerRef = useRef<((overrideTime?: number) => void) | null>(null);

  // 1. Ayarları Yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro-settings-v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
          setTimeLeft(parsed.pomodoro * 60);
        } catch (e) {
          console.warn("Ayarlar okunamadı:", e);
        }
      }
    }
  }, []);

  const saveSettings = (newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoro-settings-v2', JSON.stringify(newSettings));
    if (!isRunning) {
      setTimeLeft(newSettings[currentMode] * 60);
    }
  };

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { 
      clearInterval(intervalRef.current); 
      intervalRef.current = null; 
    }
    endTimeRef.current = null;
  }, []);

  // 2. Güncel stateleri yakalayacak callback atamaları
  useEffect(() => {
    handleFinishRef.current = () => {
      stopInterval(); 
      setIsRunning(false); 
      setIsFinished(true); 
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 1000);
      
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Süre Doldu! ⏱️', {
          body: currentMode === 'pomodoro' ? 'Harika iş çıkardın! Şimdi mola zamanı.' : 'Mola bitti, odaklanma zamanı!',
        });
      }
      
      const isPomodoro = currentMode === 'pomodoro';
      let nextMode: Mode;
      let newCount = pomodoroCount;

      if (isPomodoro) {
        nextMode = pomodoroCount % (settings.longBreakInterval + 1) === 0 ? 'longBreak' : 'shortBreak';
        newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
      } else {
        nextMode = 'pomodoro';
      }

      const nextTime = settings[nextMode] * 60;
      const autoStart = isPomodoro ? settings.autoStartBreaks : settings.autoStartPomodoros;

      // 3 Saniyelik bekleme sonrası geçiş
      setTimeout(() => { 
        setCurrentMode(nextMode); 
        setIsFinished(false); 
        setTimeLeft(nextTime); 
        
        if (autoStart) {
          startTimerRef.current?.(nextTime);
        }
      }, 3000);
    };

    startTimerRef.current = (overrideTime?: number) => {
      if (intervalRef.current) return; // Zaten çalışıyorsa engelle
      if (typeof window !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      const timeToRun = overrideTime !== undefined ? overrideTime : timeLeft;
      if (timeToRun <= 0) return;

      setIsRunning(true);
      
      // Arka plan senkronizasyonu için hedef zamanı kaydet (Background Sync)
      endTimeRef.current = Date.now() + timeToRun * 1000;

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        
        if (remaining <= 0) {
          setTimeLeft(0);
          handleFinishRef.current?.();
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // Daha hızlı tick, yüksek isabet oranı
    };
  }, [currentMode, pomodoroCount, settings, stopInterval, timeLeft]);

  // Fonksiyon Tetikleyicileri
  const startTimer  = () => startTimerRef.current?.();
  const pauseTimer  = useCallback(() => { stopInterval(); setIsRunning(false); }, [stopInterval]);
  const resetTimer  = useCallback((mode?: Mode) => { 
    stopInterval(); 
    setIsRunning(false); 
    setIsFinished(false); 
    const targetMode = mode ?? currentMode;
    setTimeLeft(settings[targetMode] * 60); 
  }, [stopInterval, currentMode, settings]);
  
  const switchMode  = useCallback((mode: Mode) => { 
    setCurrentMode(mode); 
    resetTimer(mode); 
  }, [resetTimer]);
  
  const skipSession = useCallback(() => {
    stopInterval(); setIsRunning(false);
    if (currentMode === 'pomodoro') {
      switchMode(pomodoroCount % (settings.longBreakInterval + 1) === 0 ? 'longBreak' : 'shortBreak');
      setPomodoroCount(prev => prev + 1);
    } else {
      switchMode('pomodoro');
    }
  }, [stopInterval, currentMode, pomodoroCount, settings.longBreakInterval, switchMode]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  // Pomodoro ile müzik senkronizasyonu
  useEffect(() => {
    if (!isMusicSynced || !selectedChannelId) return;
    setIsMusicPlaying(isRunning);
  }, [isRunning, isMusicSynced, selectedChannelId, setIsMusicPlaying]);

  const progress = timeLeft / (settings[currentMode] * 60);
  // Sıfıra bölme ihtimaline karşı güvenlik
  const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : progress;
  const strokeDashoffset = CIRCUMFERENCE * (1 - safeProgress);

  return (
    <>
      <button
        id="pomodoro-toggle-btn"
        onClick={() => setIsPanelOpen(prev => !prev)}
        className={`fixed top-1/2 -translate-y-1/2 z-[9999] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isPanelOpen ? 'right-[360px] rounded-l-xl' : 'right-0 rounded-l-2xl'}`}
        style={{
          width: 48,
          height: 64,
          background: isPanelOpen ? '#16a34a' : '#1a1a1a',
          border: '2px solid #22c55e',
          borderRight: 'none',
          color: '#22c55e',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '-4px 0 24px rgba(34,197,94,0.25)',
        }}
        aria-label="Pomodoro Sayacını Aç/Kapat"
        title="Pomodoro"
      >
        ⏱️
      </button>

      <div
        id="pomodoro-panel"
        className={`fixed top-1/2 -translate-y-1/2 right-0 z-[9998] flex flex-col overflow-y-auto overflow-x-hidden transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          width: 360,
          height: '85vh',
          maxHeight: 800,
          background: 'rgba(10,12,14,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRight: 'none',
          borderRadius: '20px 0 0 20px',
          padding: '28px 24px 24px',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.7), -1px 0 0 rgba(34,197,94,0.08)',
          alignItems: 'center'
        }}
      >
          <style>{`
            @keyframes pomodoroSlideIn { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes pomodoroShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
            .pomodoro-shake{animation:pomodoroShake 0.5s ease-in-out 2}
            .pomodoro-tab-btn{transition:background-color 0.2s,color 0.2s}
            .pomodoro-icon-btn:hover{border-color:#555 !important;color:#f0f0f0 !important;transform:scale(1.05)}
            .pomodoro-main-btn:hover{background-color:#16a34a !important;transform:scale(1.05)}
            .vol-slider{-webkit-appearance:none;appearance:none;height:3px;border-radius:3px;outline:none;cursor:pointer;background:linear-gradient(to right,#22c55e calc(var(--val)*100%),#444 calc(var(--val)*100%))}
            .vol-slider::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;background:#22c55e;cursor:pointer}
            
            /* Ayarlar Modalı Scrollbar Gizleme */
            .settings-scroll::-webkit-scrollbar { width: 4px; }
            .settings-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          `}</style>

          {/* Ayarlar İçiçe Menü Modalı */}
          {showSettings && (
            <div className="settings-scroll" style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,14,0.98)', zIndex: 10, padding: '28px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f0' }}>⚙️ Ayarlar</div>
                <button onClick={() => { setShowSettings(false); setSettings({...settings}); }} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>✕</button>
              </div>

              {/* Süre Ayarları */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Süreler (Dakika)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Pomodoro</span>
                  <input type="number" min="1" max="120" value={settings.pomodoro} onChange={e => setSettings({...settings, pomodoro: Math.max(1, Number(e.target.value))})} style={{ width: '64px', background: '#222', border: '1px solid #333', color: '#fff', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Kısa Mola</span>
                  <input type="number" min="1" max="60" value={settings.shortBreak} onChange={e => setSettings({...settings, shortBreak: Math.max(1, Number(e.target.value))})} style={{ width: '64px', background: '#222', border: '1px solid #333', color: '#fff', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Uzun Mola</span>
                  <input type="number" min="1" max="60" value={settings.longBreak} onChange={e => setSettings({...settings, longBreak: Math.max(1, Number(e.target.value))})} style={{ width: '64px', background: '#222', border: '1px solid #333', color: '#fff', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', outline: 'none' }} />
                </div>
              </div>

              {/* Gelişmiş Ayarlar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Geçişler ve Döngü</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Uzun Mola Sıklığı</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" min="1" max="10" value={settings.longBreakInterval} onChange={e => setSettings({...settings, longBreakInterval: Math.max(1, Number(e.target.value))})} style={{ width: '56px', background: '#222', border: '1px solid #333', color: '#fff', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', outline: 'none' }} />
                    <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.2, width: '60px' }}>kısa moladan sonra</span>
                  </div>
                </div>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginTop: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Molaları Otomatik Başlat</span>
                  <input type="checkbox" checked={settings.autoStartBreaks} onChange={e => setSettings({...settings, autoStartBreaks: e.target.checked})} style={{ accentColor: '#22c55e', width: '18px', height: '18px', cursor: 'pointer' }} />
                </label>
                
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px', color: '#ccc' }}>Odaklanmayı Otomatik Başlat</span>
                  <input type="checkbox" checked={settings.autoStartPomodoros} onChange={e => setSettings({...settings, autoStartPomodoros: e.target.checked})} style={{ accentColor: '#22c55e', width: '18px', height: '18px', cursor: 'pointer' }} />
                </label>
              </div>

              <button 
                onClick={() => { saveSettings(settings); setShowSettings(false); }}
                style={{ width: '100%', background: '#22c55e', color: '#000', border: 'none', padding: '12px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: 'auto', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(34,197,94,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Kaydet ve Uygula
              </button>
            </div>
          )}

          {/* Başlık */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'18px', fontWeight:600, color:'#f0f0f0' }}>
              <span>⏱️</span><span>Pomodoro</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize:'11px', color:'#888', opacity:0.4, fontWeight:600 }}>abbeslim</span>
              <button 
                onClick={() => setShowSettings(true)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
                title="Ayarlar"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Mod Tabları */}
          <div style={{ display:'flex', gap:'4px', background:'#222', padding:'4px', borderRadius:'100px', marginBottom:'24px', width:'100%' }}>
            {(Object.keys(MODE_LABELS) as Mode[]).map(mode => (
              <button key={mode} id={`pomodoro-tab-${mode}`} className="pomodoro-tab-btn" onClick={() => switchMode(mode)}
                style={{ flex:1, background: currentMode===mode ? '#22c55e' : 'transparent', border:'none', color: currentMode===mode ? '#000' : '#888', padding:'8px 4px', borderRadius:'100px', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {mode==='pomodoro' ? 'Pomodoro' : mode==='shortBreak' ? 'Kısa Mola' : 'Uzun Mola'}
              </button>
            ))}
          </div>

          {/* Dairesel Sayaç */}
          <div className={isShaking ? 'pomodoro-shake' : ''} style={{ position:'relative', width:'200px', height:'200px', marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="200" height="200" viewBox="0 0 120 120" style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={RADIUS} fill="transparent" stroke="#2a2a2a" strokeWidth="5"/>
              <circle cx="60" cy="60" r={RADIUS} fill="transparent" stroke={isFinished ? '#ef4444' : '#22c55e'} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} strokeDashoffset={strokeDashoffset} style={{ transition:'stroke-dashoffset 1s linear,stroke 0.3s' }}/>
            </svg>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:2 }}>
              <span id="pomodoro-time-display" style={{ fontSize:'52px', fontWeight:800, lineHeight:1, color: isFinished ? '#ef4444' : '#f0f0f0', transition:'color 0.3s', fontVariantNumeric:'tabular-nums' }}>
                {formatTime(timeLeft)}
              </span>
              <span style={{ fontSize:'12px', color:'#888', marginTop:'6px' }}>{MODE_LABELS[currentMode]}</span>
            </div>
          </div>

          {/* Kontroller */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px' }}>
            <button id="pomodoro-reset-btn" className="pomodoro-icon-btn" onClick={() => resetTimer()} title="Sıfırla"
              style={{ background:'transparent', border:'2px solid #333', color:'#666', width:'44px', height:'44px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'14px', transition:'transform 0.2s,border-color 0.2s,color 0.2s' }}>◀◀</button>
            <button id="pomodoro-play-btn" className="pomodoro-main-btn" onClick={isRunning ? pauseTimer : startTimer}
              style={{ background:'#22c55e', color:'#000', border:'none', padding:'12px 32px', borderRadius:'50px', fontSize:'15px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', transition:'background-color 0.2s,transform 0.2s' }}>
              {isRunning ? '⏸ Duraklat' : timeLeft === 0 ? '▶ Tekrar' : timeLeft < settings[currentMode] * 60 ? '▶ Devam Et' : '▶ Başla'}
            </button>
            <button id="pomodoro-skip-btn" className="pomodoro-icon-btn" onClick={skipSession} title="Atla"
              style={{ background:'transparent', border:'2px solid #333', color:'#666', width:'44px', height:'44px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'14px', transition:'transform 0.2s,border-color 0.2s,color 0.2s' }}>⏭</button>
          </div>

          <div style={{ fontSize:'13px', color:'#666', marginBottom: selectedChannelId ? '16px' : '0' }}>
            🍅 {pomodoroCount}. Pomodoro
          </div>

          {/* Kompakt Mini Player (Müzik seçiliyse gösterilir) */}
          {selectedChannelId && activeChannel && activeTrack && (
            <div style={{ width: '100%', borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
              {/* Satır 1: Kapak + İsim + Kontroller */}
              <div style={{ background: '#222', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                {/* Kapak ikonu */}
                <div
                  onClick={onOpenMusicPanel}
                  className={isMusicPlaying ? 'music-cover-spin' : ''}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: activeChannel.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginRight: '10px', flexShrink: 0, cursor: onOpenMusicPanel ? 'pointer' : 'default' }}
                  title={onOpenMusicPanel ? 'Müzik panelini aç' : ''}
                >
                  {activeChannel.icon}
                </div>
                {/* İsim alanı */}
                <div
                  onClick={onOpenMusicPanel}
                  style={{ flex: 1, minWidth: 0, cursor: onOpenMusicPanel ? 'pointer' : 'default' }}
                  title={onOpenMusicPanel ? 'Müzik panelini aç' : ''}
                >
                  <div style={{ fontSize: '12px', color: '#f0f0f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeTrack.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeChannel.name}
                  </div>
                </div>
                {/* Oynatma kontrolleri */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <button onClick={handlePrevTrack} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'transparent', border: 'none', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>◀</button>
                  <button onClick={() => setIsMusicPlaying(p => !p)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
                    {isMusicPlaying ? '⏸' : '▶'}
                  </button>
                  <button onClick={handleNextTrack} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'transparent', border: 'none', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>▶</button>
                </div>
              </div>

              {/* Satır 2: Ses Kontrolü */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '0 4px' }}>
                {/* Ses ikonu (tıkla → mute toggle) */}
                <button
                  onClick={() => setIsMuted(m => !m)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0, lineHeight: 1 }}
                  title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
                >
                  <VolumeIcon muted={isMuted} volume={volume} />
                </button>
                {/* Ses slider */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (isMuted && v > 0) setIsMuted(false);
                  }}
                  className="vol-slider"
                  style={{ flex: 1, ['--val' as any]: isMuted ? 0 : volume } as React.CSSProperties}
                />
                {/* Ses yüzdesi */}
                <span style={{ fontSize: '10px', color: '#555', width: '26px', textAlign: 'right', flexShrink: 0 }}>
                  {isMuted ? '0' : Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
    </>
  );
}
