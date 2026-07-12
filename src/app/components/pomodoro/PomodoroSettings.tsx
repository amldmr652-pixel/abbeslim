import { useState } from 'react';
import { defaultSettings } from '../../hooks/usePomodoroTimer';

interface PomodoroSettingsProps {
  initialSettings: typeof defaultSettings;
  onSave: (settings: typeof defaultSettings) => void;
  onClose: () => void;
}

export default function PomodoroSettings({ initialSettings, onSave, onClose }: PomodoroSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="settings-scroll" style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,14,0.98)', zIndex: 10, padding: '28px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f0' }}>⚙️ Ayarlar</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>✕</button>
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
        onClick={handleSave}
        style={{ width: '100%', background: '#22c55e', color: '#000', border: 'none', padding: '12px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: 'auto', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(34,197,94,0.2)' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Kaydet ve Uygula
      </button>
    </div>
  );
}
