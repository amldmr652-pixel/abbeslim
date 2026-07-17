'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGamesStore } from '@/stores/useGamesStore';
import { Gamepad2, BrainCircuit, Grid3x3, Hash, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import SnakeGame from '../components/games/SnakeGame';
import MemoryGame from '../components/games/MemoryGame';
import TicTacToeGame from '../components/games/TicTacToeGame';
import Game2048 from '../components/games/Game2048';

import { useSettingsStore } from '@/stores/useSettingsStore';

export default function GamesPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const { timePlayedToday, incrementTime, gameStats, checkAndResetDaily } = useGamesStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Mounted check to prevent hydration mismatch for time
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    checkAndResetDaily();
  }, [checkAndResetDaily]);

  const dailyLimit = (settings.gamesDailyLimit || 15) * 60;
  const limitReached = timePlayedToday >= dailyLimit;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeGame && timePlayedToday < dailyLimit) {
      timer = setInterval(() => {
        incrementTime(activeGame);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeGame, incrementTime, timePlayedToday, dailyLimit]);

  if (!mounted) return <div className="flex-1 p-8 text-center text-gray-500">Yükleniyor...</div>;

  if (limitReached) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto h-full">
        <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-500/30 animate-bounce">
          <Lock size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t('games.limitReached') || 'Günlük Oyun Limitine Ulaşıldı!'}</h1>
        <p className="text-gray-400 leading-relaxed mb-8">
          {t('games.limitMessage') || 'Bugün için belirlenen oyun oynama sürenizin sonuna geldiniz. Şimdi derslerinize odaklanma zamanı! Limitiniz yarın sıfırlanacaktır.'}
        </p>
      </div>
    );
  }

  if (activeGame) {
    const renderGame = () => {
      switch (activeGame) {
        case 'snake': return <SnakeGame />;
        case 'memory': return <MemoryGame />;
        case 'tictactoe': return <TicTacToeGame />;
        case 'game2048': return <Game2048 />;
        default: return null;
      }
    };

    const remainingSeconds = Math.max(0, dailyLimit - timePlayedToday);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return (
      <div className="flex-1 flex flex-col h-full relative">
        {/* Game Header */}
        <div className="flex justify-between items-center p-4 border-b border-green-900/20 glass sticky top-0 z-10">
          <button 
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{t('games.back') || 'Geri'}</span>
          </button>
          <div className="text-sm font-medium">
            <span className="text-gray-400">{t('games.timeRemaining') || 'Kalan Süre'}: </span>
            <span className={`font-mono ${remainingSeconds < 60 ? 'text-red-500 animate-pulse font-bold' : 'text-green-400'}`}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        
        {/* Game Content */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          {renderGame()}
        </div>
      </div>
    );
  }

  const remainingSeconds = Math.max(0, dailyLimit - timePlayedToday);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercent = Math.min(100, (timePlayedToday / dailyLimit) * 100);

  const gamesList = [
    { id: 'snake', icon: <Gamepad2 size={32} />, name: t('games.snake') || 'Yılan Oyunu', desc: t('games.snakeDesc') || 'Klasik yılan oyunu. Yemleri toplayın, kendinize çarpmayın!', color: 'from-green-600/20 to-emerald-900/20' },
    { id: 'memory', icon: <BrainCircuit size={32} />, name: t('games.memory') || 'Hafıza Kartları', desc: t('games.memoryDesc') || 'Kart eşleştirmece. Hafızanızı test edin.', color: 'from-blue-600/20 to-indigo-900/20' },
    { id: 'tictactoe', icon: <Grid3x3 size={32} />, name: t('games.tictactoe') || 'XOX Oyunu', desc: t('games.tictactoeDesc') || '3x3 grid üzerinde X ve O eşleştirmesi.', color: 'from-purple-600/20 to-fuchsia-900/20' },
    { id: 'game2048', icon: <Hash size={32} />, name: t('games.game2048') || '2048 Bulmacası', desc: t('games.game2048Desc') || 'Sayıları toplayarak 2048 karosuna ulaşmaya çalışın.', color: 'from-yellow-600/20 to-orange-900/20' },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('games.title') || 'Oyunlar'}</h1>
          <p className="text-gray-400">{t('games.subtitle') || 'Odaklanma aralarında beyninizi dinlendirecek mini oyunlar'}</p>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl mb-10 border border-green-900/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-green-500/20 w-full">
          <div 
            className="h-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-gray-400 mb-1">{t('games.timeRemaining') || 'Kalan Süre'}</div>
            <div className={`text-4xl font-bold font-mono tracking-wider ${remainingSeconds < 180 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Limit</div>
            <div className="text-sm text-gray-400 font-semibold">{Math.floor(dailyLimit / 60)} dk / Gün</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {gamesList.map(game => {
          const gameTime = gameStats[game.id] || 0;
          const gameMins = Math.floor(gameTime / 60);
          const gameSecs = gameTime % 60;
          
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="glass rounded-3xl p-6 text-left hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.15)] group relative overflow-hidden border border-green-900/5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 flex gap-5 items-start">
                <div className="w-14 h-14 bg-black/50 rounded-2xl flex items-center justify-center border border-white/5 text-gray-300 group-hover:text-green-400 group-hover:border-green-500/30 transition-all shadow-inner">
                  {game.icon}
                </div>
                <div className="flex-1 rtl:mr-2">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-green-300 transition-colors">{game.name}</h3>
                    {gameTime > 0 && (
                      <span className="text-[10px] font-bold font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
                        {gameMins}d {gameSecs}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{game.desc}</p>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-500 opacity-0 ltr:-translate-x-2 rtl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <span>{t('games.play') || 'Oyna'}</span>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
