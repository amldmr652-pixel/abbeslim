import { Mode, MODE_LABELS } from '../../hooks/usePomodoroTimer';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface PomodoroTimerProps {
  currentMode: Mode;
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  isShaking: boolean;
  pomodoroCount: number;
  totalTimeForMode: number;
  switchMode: (mode: Mode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
}

export default function PomodoroTimer({
  currentMode,
  timeLeft,
  isRunning,
  isFinished,
  isShaking,
  pomodoroCount,
  totalTimeForMode,
  switchMode,
  startTimer,
  pauseTimer,
  resetTimer,
  skipSession
}: PomodoroTimerProps) {
  const progress = timeLeft / totalTimeForMode;
  const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : progress;
  const strokeDashoffset = CIRCUMFERENCE * (1 - safeProgress);

  return (
    <>
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
          {isRunning ? '⏸ Duraklat' : timeLeft === 0 ? '▶ Tekrar' : timeLeft < totalTimeForMode ? '▶ Devam Et' : '▶ Başla'}
        </button>
        <button id="pomodoro-skip-btn" className="pomodoro-icon-btn" onClick={skipSession} title="Atla"
          style={{ background:'transparent', border:'2px solid #333', color:'#666', width:'44px', height:'44px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'14px', transition:'transform 0.2s,border-color 0.2s,color 0.2s' }}>⏭</button>
      </div>
    </>
  );
}
