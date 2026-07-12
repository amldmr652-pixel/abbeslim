'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Board = number[][];

const SIZE = 4;

const getEmptyBoard = (): Board => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

const addRandomTile = (board: Board): Board => {
  const emptyTiles: { r: number, c: number }[] = [];
  board.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val === 0) emptyTiles.push({ r, c });
    });
  });

  if (emptyTiles.length === 0) return board;

  const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[randomTile.r][randomTile.c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

export default function Game2048() {
  const { t } = useTranslation();
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(getEmptyBoard())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const moveLeft = useCallback((currentBoard: Board): { newBoard: Board, points: number, moved: boolean } => {
    let points = 0;
    let moved = false;
    const newBoard = currentBoard.map(row => {
      const newRow = row.filter(val => val !== 0);
      for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] !== 0 && newRow[i] === newRow[i + 1]) {
          newRow[i] *= 2;
          points += newRow[i];
          newRow.splice(i + 1, 1);
        }
      }
      while (newRow.length < SIZE) newRow.push(0);
      if (row.join(',') !== newRow.join(',')) moved = true;
      return newRow;
    });
    return { newBoard, points, moved };
  }, []);

  const rotateRight = (matrix: Board) => {
    const result = getEmptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        result[c][SIZE - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    } else {
      return;
    }

    let currentBoard = board;
    let points = 0;
    let moved = false;

    if (e.key === 'ArrowLeft') {
      const res = moveLeft(currentBoard);
      currentBoard = res.newBoard;
      points = res.points;
      moved = res.moved;
    } else if (e.key === 'ArrowRight') {
      currentBoard = rotateRight(rotateRight(currentBoard));
      const res = moveLeft(currentBoard);
      currentBoard = rotateRight(rotateRight(res.newBoard));
      points = res.points;
      moved = res.moved;
    } else if (e.key === 'ArrowUp') {
      currentBoard = rotateRight(rotateRight(rotateRight(currentBoard)));
      const res = moveLeft(currentBoard);
      currentBoard = rotateRight(res.newBoard);
      points = res.points;
      moved = res.moved;
    } else if (e.key === 'ArrowDown') {
      currentBoard = rotateRight(currentBoard);
      const res = moveLeft(currentBoard);
      currentBoard = rotateRight(rotateRight(rotateRight(res.newBoard)));
      points = res.points;
      moved = res.moved;
    }

    if (moved) {
      const nextBoard = addRandomTile(currentBoard);
      setBoard(nextBoard);
      setScore(s => s + points);

      // Check game over
      let canMove = false;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (nextBoard[r][c] === 0) canMove = true;
          if (c < SIZE - 1 && nextBoard[r][c] === nextBoard[r][c + 1]) canMove = true;
          if (r < SIZE - 1 && nextBoard[r][c] === nextBoard[r + 1][c]) canMove = true;
        }
      }
      if (!canMove) setGameOver(true);
    }
  }, [board, gameOver, moveLeft]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = () => {
    setBoard(addRandomTile(addRandomTile(getEmptyBoard())));
    setScore(0);
    setGameOver(false);
  };

  const getColor = (val: number) => {
    const colors: Record<number, string> = {
      0: 'bg-white/5 text-transparent',
      2: 'bg-yellow-500/10 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
      4: 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
      8: 'bg-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      16: 'bg-orange-500/50 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.5)]',
      32: 'bg-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]',
      64: 'bg-red-600/70 text-red-200 shadow-[0_0_25px_rgba(220,38,38,0.6)]',
      128: 'bg-yellow-400/80 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.7)] text-3xl',
      256: 'bg-yellow-400/90 text-white shadow-[0_0_35px_rgba(250,204,21,0.8)] text-3xl',
      512: 'bg-yellow-500 text-white shadow-[0_0_40px_rgba(234,179,8,0.9)] text-3xl',
      1024: 'bg-orange-500 text-white shadow-[0_0_45px_rgba(249,115,22,1)] text-2xl',
      2048: 'bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,1)] text-2xl',
    };
    return colors[val] || 'bg-purple-500 text-white shadow-[0_0_50px_rgba(168,85,247,1)] text-2xl';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-xl font-bold text-white flex justify-between w-full max-w-[360px]">
        <span>{t('games.game2048')}</span>
        <span className="text-orange-400">{t('games.score')}: {score}</span>
      </div>
      
      <div className="bg-black/60 p-4 rounded-3xl border border-yellow-900/30 relative shadow-2xl">
        <div className="grid grid-cols-4 gap-3">
          {board.map((row, r) => (
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl font-bold text-2xl sm:text-3xl transition-all duration-200 ${getColor(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          ))}
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-20 rounded-3xl">
            <h2 className="text-3xl font-bold text-red-500 mb-2">{t('games.gameOver')}</h2>
            <p className="text-gray-300 mb-6">{t('games.score')}: {score}</p>
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl font-bold shadow-lg transition-transform hover:scale-105"
            >
              {t('games.restart')}
            </button>
          </div>
        )}
      </div>
      
      {!gameOver && (
        <>
          {/* Mobil Kontroller (Sanal Yön Tuşları) */}
          <div className="mt-8 grid grid-cols-3 gap-3 md:hidden w-[200px]">
            <div />
            <button 
              onClick={() => handleKeyDown({ key: 'ArrowUp', preventDefault: () => {} } as any)} 
              className="bg-yellow-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-yellow-700/60 active:scale-95 transition-all border border-yellow-700/30"
            >
              <ArrowUp size={28} className="text-yellow-400" />
            </button>
            <div />
            <button 
              onClick={() => handleKeyDown({ key: 'ArrowLeft', preventDefault: () => {} } as any)} 
              className="bg-yellow-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-yellow-700/60 active:scale-95 transition-all border border-yellow-700/30"
            >
              <ArrowLeft size={28} className="text-yellow-400" />
            </button>
            <button 
              onClick={() => handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any)} 
              className="bg-yellow-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-yellow-700/60 active:scale-95 transition-all border border-yellow-700/30"
            >
              <ArrowDown size={28} className="text-yellow-400" />
            </button>
            <button 
              onClick={() => handleKeyDown({ key: 'ArrowRight', preventDefault: () => {} } as any)} 
              className="bg-yellow-900/40 p-4 rounded-2xl flex items-center justify-center active:bg-yellow-700/60 active:scale-95 transition-all border border-yellow-700/30"
            >
              <ArrowRight size={28} className="text-yellow-400" />
            </button>
          </div>

          <p className="mt-8 text-sm text-gray-500 max-w-[360px] text-center hidden md:block">{t('games.game2048Desc')}</p>
        </>
      )}
    </div>
  );
}
