'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useMusicContext } from '@/app/context/MusicContext';

export default function MusicPanelModal() {
  const {
    isMusicSynced, setIsMusicSynced,
    selectedChannelId, handleSelectChannel,
    isMusicPlaying, setIsMusicPlaying,
    activeChannel, activeTrack,
    handlePrevTrack, handleNextTrack,
    channels, addChannel, removeChannel,
    volume, setVolume, isMuted, setIsMuted,
    isMusicPanelOpen, setIsMusicPanelOpen,
  } = useMusicContext();

  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('🎵');
  const [newChannelUrl, setNewChannelUrl] = useState('');

  if (!isMusicPanelOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-[400px] rounded-[24px] p-6 relative animate-in fade-in zoom-in duration-200 shadow-[0_0_40px_rgba(34,197,94,0.15)] bg-[#1a1a1a]">

        <button
          onClick={() => setIsMusicPanelOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Başlık Alanı */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600, color: '#f0f0f0' }}>
            <span>🎵</span><span>Odak Müzik</span>
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            Spotify benzeri değil. Sadece odaklanma odaklı.
          </div>
        </div>

        {/* Senkronizasyon ve Ses Satırı */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          {/* Ses Kontrolü */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsMuted(v => !v)}
              style={{ background: 'transparent', border: 'none', color: isMuted ? '#ef4444' : '#888', cursor: 'pointer', fontSize: '18px' }}
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            >
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
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
              style={{ width: '80px', accentColor: '#22c55e', cursor: 'pointer' }}
            />
          </div>

          {/* Pomodoro Senkronizasyon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>⏱️ Senkronize</span>
            <div
              onClick={() => setIsMusicSynced(v => !v)}
              style={{ width: '36px', height: '20px', borderRadius: '10px', background: isMusicSynced ? '#22c55e' : '#333', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: '3px', left: isMusicSynced ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>

        {/* Kanal Listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
          {channels.length === 0 && (
            <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '16px 0' }}>Henüz liste yok — aşağıdan ekle</div>
          )}
          {channels.map(channel => {
            const isSelected = selectedChannelId === channel.id;
            const isYTP = channel.tracks[0]?.audioSrc?.startsWith('yt-playlist:');
            return (
              <div
                key={channel.id}
                style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '12px', background: isSelected ? '#1e2e1e' : 'transparent', borderLeft: isSelected ? '2px solid #22c55e' : '2px solid transparent', transition: 'background 0.2s' }}
              >
                <div onClick={() => handleSelectChannel(channel.id)} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, cursor: 'pointer', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: channel.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{channel.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{channel.name}</div>
                    {isYTP && <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>▶ YouTube Playlist</div>}
                  </div>
                </div>
                <span style={{ color: isSelected ? '#22c55e' : '#333', fontSize: '11px', padding: '0 4px', flexShrink: 0 }}>▶</span>
                <button
                  onClick={e => { e.stopPropagation(); removeChannel(channel.id); }}
                  title="Sil"
                  style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '13px', padding: '4px 6px', borderRadius: '6px', flexShrink: 0, lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* Özel Mini Player */}
        {selectedChannelId && activeChannel && activeTrack && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', border: '1px solid #2a2a2a' }}>
            <div
              className={isMusicPlaying ? "music-cover-spin" : ""}
              style={{ width: '44px', height: '44px', borderRadius: '50%', background: activeChannel.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}
            >
              {activeChannel.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeTrack.title}
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{activeChannel.name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={handlePrevTrack} title="Önceki" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px', padding: '4px', display: 'flex', alignItems: 'center' }}>◀◀</button>
              <button onClick={() => setIsMusicPlaying(p => !p)} title={isMusicPlaying ? 'Duraklat' : 'Oynat'} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#22c55e', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>
                {isMusicPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={handleNextTrack} title="Sonraki" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px', padding: '4px', display: 'flex', alignItems: 'center' }}>▶▶</button>
            </div>
          </div>
        )}

        {/* Yeni Liste Ekleme Formu / Butonu */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!isAddingChannel ? (
            <button
              onClick={() => setIsAddingChannel(true)}
              style={{ color: '#22c55e', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ＋ Yeni Odak Listesi Ekle
            </button>
          ) : (
            <div style={{ width: '100%', background: '#222', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0', marginBottom: '4px' }}>Yeni Liste Oluştur</div>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '12px' }}>YouTube playlist linki veya direkt MP3 URL&apos;i yapıştır</div>

              <input
                type="text"
                placeholder="Liste Adı (Örn: Lofi Çalışma)"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }}
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="🎵"
                  value={newChannelIcon}
                  onChange={e => setNewChannelIcon(e.target.value)}
                  style={{ width: '58px', padding: '8px', borderRadius: '8px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '18px', outline: 'none', textAlign: 'center', flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder="youtube.com/playlist?list=... veya MP3 URL"
                  value={newChannelUrl}
                  onChange={e => setNewChannelUrl(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: '#111', border: `1px solid ${newChannelUrl.includes('list=') ? '#22c55e55' : '#333'}`, color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              {/* Otomatik tespit göstergesi */}
              {newChannelUrl.trim() && (
                <div style={{ fontSize: '11px', marginBottom: '8px', padding: '6px 10px', borderRadius: '6px', background: newChannelUrl.includes('list=') ? '#0a2a0a' : '#1a1a2a', color: newChannelUrl.includes('list=') ? '#22c55e' : '#888', border: `1px solid ${newChannelUrl.includes('list=') ? '#22c55e33' : '#333'}` }}>
                  {newChannelUrl.includes('list=')
                    ? '✅ YouTube Playlist algılandı — otomatik çalacak'
                    : '🎵 Direkt ses URL\'i olarak eklenecek'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => { setIsAddingChannel(false); setNewChannelName(''); setNewChannelUrl(''); setNewChannelIcon('🎵'); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#333', color: '#f0f0f0', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >İptal</button>
                <button
                  onClick={() => {
                    if (!newChannelName.trim() || !newChannelUrl.trim()) return alert('Liste adı ve URL zorunludur.');
                    const newId = 'custom-' + Date.now();
                    let audioSrc = newChannelUrl.trim();
                    let artist = 'Özel Liste';
                    if (audioSrc.includes('list=')) {
                      const match = audioSrc.match(/[?&]list=([^&\s]+)/);
                      if (match) { audioSrc = 'yt-playlist:' + match[1]; artist = 'YouTube Playlist'; }
                    }
                    addChannel({
                      id: newId,
                      name: newChannelName.trim(),
                      icon: newChannelIcon || '🎵',
                      coverBg: audioSrc.startsWith('yt-playlist:') ? '#1a0a2a' : '#222',
                      tracks: [{ title: newChannelName.trim(), artist, audioSrc }]
                    });
                    setIsAddingChannel(false);
                    setNewChannelName(''); setNewChannelUrl(''); setNewChannelIcon('🎵');
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#22c55e', color: '#000', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                >Ekle</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
