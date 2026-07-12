'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const { t } = useTranslation();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateFood = useCallback(() => {
    let newFood: { x: number; y: number };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    generateFood();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Sadece oklarsa sayfa kaymasýný engelle
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Collision check
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE || 
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - (score * 2));
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [snake, direction, food, isPlaying, gameOver, score, generateFood]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-xl font-bold text-white flex justify-between w-full max-w-[400px]">
        <span>{t('games.snake')}</span>
        <span className="text-green-400">{t('games.score')}: {score}</span>
      </div>
      
      <div 
        className="bg-black/50 border border-green-900/50 rounded-xl overflow-hidden relative shadow-2xl"
        style={{ width: 400, height: 400 }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div key={i} className="border border-white/[0.02]" />
          ))}
        </div>

        {/* Food */}
        <div 
          className="absolute bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
          style={{
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
            left: `${(food.x * 100) / GRID_SIZE}%`,
            top: `${(food.y * 100) / GRID_SIZE}%`,
            transform: 'scale(0.8)'
          }}
        />

        {/* Snake */}
        {snake.map((segment, i) => (
          <div 
            key={i}
            className={`absolute rounded-sm ${i === 0 ? 'bg-green-400 z-10' : 'bg-green-600'} shadow-[0_0_10px_rgba(34,197,94,0.5)]`}
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              left: `${(segment.x * 100) / GRID_SIZE}%`,
              top: `${(segment.y * 100) / GRID_SIZE}%`,
              transform: 'scale(0.95)'
            }}
          />
        ))}

        {/* Overlays */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-20">
            <button onClick={resetGame} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105">
              {t('games.play')}
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-20">
            <h2 className="text-3xl font-bold text-red-500 mb-2">{t('games.gameOver')}</h2>
            <p className="text-gray-300 mb-6">{t('games.score')}: {score}</p>
            <button onClick={resetGame} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105">
              {t('games.restart')}
            </button>
          </div>
        )}
      </div>
      
      {/* Mobil Kontroller (Sanal Yön Tuşları) */}
      <div className="mt-8 grid grid-cols-3 gap-3 md:hidden w-[200px]">
        <div />
        <button 
          onClick={() => { if (direction.y !== 1) setDirection({ x: 0, y: -1 }) }} 
          className="bg-green-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-green-700/60 active:scale-95 transition-all border border-green-700/30"
        >
          <ArrowUp size={28} className="text-green-400" />
        </button>
        <div />
        <button 
          onClick={() => { if (direction.x !== 1) setDirection({ x: -1, y: 0 }) }} 
          className="bg-green-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-green-700/60 active:scale-95 transition-all border border-green-700/30"
        >
          <ArrowLeft size={28} className="text-green-400" />
        </button>
        <button 
          onClick={() => { if (direction.y !== -1) setDirection({ x: 0, y: 1 }) }} 
          className="bg-green-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-green-700/60 active:scale-95 transition-all border border-green-700/30"
        >
          <ArrowDown size={28} className="text-green-400" />
        </button>
        <button 
          onClick={() => { if (direction.x !== -1) setDirection({ x: 1, y: 0 }) }} 
          className="bg-green-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-green-700/60 active:scale-95 transition-all border border-green-700/30"
        >
          <ArrowRight size={28} className="text-green-400" />
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-500 max-w-[400px] text-center hidden md:block">{t('games.snakeDesc')}</p>
    </div>
  );
}
