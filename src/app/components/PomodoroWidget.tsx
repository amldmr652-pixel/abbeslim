'use client';

import { useState } from 'react';
import { useMusicContext } from '../context/MusicContext';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import PomodoroTimer from './pomodoro/PomodoroTimer';
import PomodoroSettings from './pomodoro/PomodoroSettings';

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <span>🔇</span>;
  if (volume < 0.4) return <span>🔈</span>;
  if (volume < 0.7) return <span>🔉</span>;
  return <span>🔊</span>;
}

interface PomodoroWidgetProps {
  onOpenMusicPanel?: () => void;
  isDropdown?: boolean;
}

export default function PomodoroWidget({ onOpenMusicPanel, isDropdown = false }: PomodoroWidgetProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  const timerHook = usePomodoroTimer();

  // Music Context for Mini Player
  const {
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

  return (
    <div
      id="pomodoro-panel"
      className="flex flex-col overflow-y-auto overflow-x-hidden"
      style={{
        width: isDropdown ? 360 : 360,
        maxHeight: isDropdown ? 'calc(100vh - 80px)' : 800,
        background: 'rgba(10,12,14,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: isDropdown ? '20px' : '20px 0 0 20px',
        padding: '28px 24px 24px',
        boxShadow: isDropdown 
          ? '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.08)' 
          : '-8px 0 48px rgba(0,0,0,0.7)',
        alignItems: 'center'
      }}
      onClick={(e) => e.stopPropagation()}
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
          .settings-scroll::-webkit-scrollbar { width: 4px; }
          .settings-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        `}</style>

        {/* Ayarlar Modalı */}
        {showSettings && (
          <PomodoroSettings
            initialSettings={timerHook.settings}
            onSave={timerHook.saveSettings}
            onClose={() => setShowSettings(false)}
          />
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

        <PomodoroTimer
          currentMode={timerHook.currentMode}
          timeLeft={timerHook.timeLeft}
          isRunning={timerHook.isRunning}
          isFinished={timerHook.isFinished}
          isShaking={timerHook.isShaking}
          pomodoroCount={timerHook.pomodoroCount}
          totalTimeForMode={timerHook.settings[timerHook.currentMode] * 60}
          switchMode={timerHook.switchMode}
          startTimer={timerHook.startTimer}
          pauseTimer={timerHook.pauseTimer}
          resetTimer={timerHook.resetTimer}
          skipSession={timerHook.skipSession}
        />

        <div style={{ fontSize:'13px', color:'#666', marginBottom: selectedChannelId ? '16px' : '0' }}>
          🍅 {timerHook.pomodoroCount}. Pomodoro
        </div>

        {/* Kompakt Mini Player */}
        {selectedChannelId && activeChannel && activeTrack && (
          <div style={{ width: '100%', borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
            <div style={{ background: '#222', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
              <div
                onClick={onOpenMusicPanel}
                className={isMusicPlaying ? 'music-cover-spin' : ''}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: activeChannel.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginRight: '10px', flexShrink: 0, cursor: onOpenMusicPanel ? 'pointer' : 'default' }}
                title={onOpenMusicPanel ? 'Müzik panelini aç' : ''}
              >
                {activeChannel.icon}
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                <button onClick={handlePrevTrack} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'transparent', border: 'none', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>◀</button>
                <button onClick={() => setIsMusicPlaying(p => !p)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
                  {isMusicPlaying ? '⏸' : '▶'}
                </button>
                <button onClick={handleNextTrack} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'transparent', border: 'none', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>▶</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '0 4px' }}>
              <button
                onClick={() => setIsMuted(m => !m)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0, lineHeight: 1 }}
                title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
              >
                <VolumeIcon muted={isMuted} volume={volume} />
              </button>
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
              <span style={{ fontSize: '10px', color: '#555', width: '26px', textAlign: 'right', flexShrink: 0 }}>
                {isMuted ? '0' : Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
  );
}
