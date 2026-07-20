'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Bomb, Flag, Trophy } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export default function MinesweeperGame() {
  const { t } = useTranslation();
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [minesCount, setMinesCount] = useState(10);

  const [board, setBoard] = useState<Cell[][]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(10);
  const [flagMode, setFlagMode] = useState(false);

  const initGame = () => {
    // 1. Create empty board
    const newBoard: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r, c,
          isMine: false,
          isOpen: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      newBoard.push(row);
    }

    // 2. Place mines
    let placed = 0;
    while (placed < minesCount) {
      const randR = Math.floor(Math.random() * rows);
      const randC = Math.floor(Math.random() * cols);
      if (!newBoard[randR][randC].isMine) {
        newBoard[randR][randC].isMine = true;
        placed++;
      }
    }

    // 3. Count neighbor mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
    setIsGameOver(false);
    setIsWon(false);
    setFlagsLeft(minesCount);
  };

  useEffect(() => {
    initGame();
  }, [rows, cols, minesCount]);

  const revealCell = (b: Cell[][], r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const cell = b[r][c];
    if (cell.isOpen || cell.isFlagged) return;

    cell.isOpen = true;
    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) revealCell(b, r + dr, c + dc);
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || isWon) return;

    const cell = board[r][c];
    if (flagMode) {
      handleRightClick(r, c);
      return;
    }

    if (cell.isOpen || cell.isFlagged) return;

    const newBoard = board.map(row => row.map(cItem => ({ ...cItem })));
    const targetCell = newBoard[r][c];

    if (targetCell.isMine) {
      // Game Over
      newBoard.forEach(row => row.forEach(ci => {
        if (ci.isMine) ci.isOpen = true;
      }));
      setBoard(newBoard);
      setIsGameOver(true);
      return;
    }

    revealCell(newBoard, r, c);
    setBoard(newBoard);

    // Check win condition
    let unrevealedSafeCells = 0;
    newBoard.forEach(row => row.forEach(ci => {
      if (!ci.isMine && !ci.isOpen) unrevealedSafeCells++;
    }));

    if (unrevealedSafeCells === 0) {
      setIsWon(true);
    }
  };

  const handleRightClick = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isGameOver || isWon) return;

    const cell = board[r][c];
    if (cell.isOpen) return;

    const newBoard = board.map(row => row.map(cItem => ({ ...cItem })));
    const targetCell = newBoard[r][c];

    if (targetCell.isFlagged) {
      targetCell.isFlagged = false;
      setFlagsLeft(prev => prev + 1);
    } else if (flagsLeft > 0) {
      targetCell.isFlagged = true;
      setFlagsLeft(prev => prev - 1);
    }

    setBoard(newBoard);
  };

  const getNumberColor = (n: number) => {
    switch (n) {
      case 1: return 'text-blue-400';
      case 2: return 'text-green-400';
      case 3: return 'text-red-400';
      case 4: return 'text-purple-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      <div className="flex justify-between items-center w-full mb-6 glass p-4 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          💣 Mayın Tarlası
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-red-400 font-bold text-sm">
            <Flag size={16} /> {flagsLeft}
          </div>
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              flagMode ? 'bg-red-500 text-stone-950 border-red-400' : 'bg-black/40 text-gray-300 border-white/10'
            }`}
          >
            <Flag size={14} /> Bayrak Modu
          </button>
          <button onClick={initGame} className="p-2 glass text-gray-300 hover:text-white rounded-xl">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {isGameOver && (
        <div className="w-full bg-red-900/40 border border-red-500/50 p-4 rounded-2xl text-center text-red-300 font-bold mb-4">
          💥 Mayına Bastınız! Game Over.
        </div>
      )}

      {isWon && (
        <div className="w-full bg-green-900/40 border border-green-500/50 p-4 rounded-2xl text-center text-green-300 font-bold mb-4 animate-bounce">
          🎉 Tebrikler! Tüm Mayınları Temizlediniz!
        </div>
      )}

      {/* Grid */}
      <div 
        className="grid gap-1 bg-black/60 p-3 rounded-2xl border border-white/10 shadow-2xl mb-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => handleRightClick(r, c, e)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-sm transition-all ${
                cell.isOpen
                  ? cell.isMine
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-900 text-white border border-white/5'
                  : cell.isFlagged
                  ? 'bg-red-950/80 text-red-400 border border-red-500/50'
                  : 'bg-stone-800 hover:bg-stone-700 text-white border border-white/10'
              }`}
            >
              {cell.isOpen ? (
                cell.isMine ? (
                  <Bomb size={18} />
                ) : cell.neighborMines > 0 ? (
                  <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                ) : (
                  ''
                )
              ) : cell.isFlagged ? (
                <Flag size={14} />
              ) : (
                ''
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
