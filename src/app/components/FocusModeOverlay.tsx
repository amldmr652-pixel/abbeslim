'use client';

import { useEffect, useState } from 'react';
import { useFocusStore } from '@/stores/useFocusStore';
import { usePomodoroTimer, MODE_LABELS } from '@/app/hooks/usePomodoroTimer';
import { Button } from '@/app/components/ui';
import { Play, Pause, Square, SkipForward, X, Maximize } from 'lucide-react';
import { useTaskStore } from '@/stores/useTaskStore';
import { useMusicContext } from '@/app/context/MusicContext';

export default function FocusModeOverlay() {
  const { isFocusModeActive, setFocusMode } = useFocusStore();
  const { 
    timeLeft, currentMode, isRunning, startTimer, pauseTimer, 
    resetTimer, switchMode, skipSession, isFinished, isShaking 
  } = usePomodoroTimer();
  
  const { tasks } = useTaskStore();
  const { setIsMusicPanelOpen } = useMusicContext();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFocusModeActive) {
      // Enter Fullscreen if possible
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      // Exit Fullscreen
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFocusModeActive]);

  if (!mounted || !isFocusModeActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const urgentTasks = tasks.filter(t => !t.is_completed).slice(0, 3);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 to-transparent pointer-events-none"></div>
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 rounded-full p-1">
            {(['pomodoro', 'shortBreak', 'longBreak'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentMode === mode ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsMusicPanelOpen(true)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            Odak Müziği
          </button>
        </div>
        
        <button 
          onClick={() => setFocusMode(false)}
          className="p-3 bg-red-900/30 text-red-400 hover:bg-red-900/60 rounded-full transition-colors flex items-center gap-2"
        >
          <X size={20} /> Çıkış Yap
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <h1 className="text-2xl text-green-400 font-medium mb-8 tracking-widest uppercase">
          {MODE_LABELS[currentMode]}
        </h1>
        
        <div className={`text-[12rem] leading-none font-bold tabular-nums mb-12 tracking-tighter ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {timeString}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRunning ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-green-500 hover:bg-green-400 text-white hover:scale-105'
            }`}
          >
            {isRunning ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-2" />}
          </button>

          <button
            onClick={() => resetTimer()}
            className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Sıfırla"
          >
            <Square size={24} className="fill-current" />
          </button>

          <button
            onClick={skipSession}
            className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Geç"
          >
            <SkipForward size={24} className="fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Urgent Tasks */}
      <div className="p-8 z-10 flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Öncelikli Görevler</h3>
        {urgentTasks.length > 0 ? (
          <div className="flex gap-4">
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {task.title}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Bekleyen görev yok.</p>
        )}
      </div>

    </div>
  );
}
