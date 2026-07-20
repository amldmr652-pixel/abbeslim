'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, RotateCcw, Lightbulb } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

// Pre-generated valid Sudoku puzzles with easy, medium, hard solution/initial pairs
const SUDOKU_PUZZLES: Record<string, Array<{ initial: number[][]; solution: number[][] }>> = {
  easy: [
    {
      initial: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ]
    },
    {
      initial: [
        [0, 0, 3, 0, 2, 0, 6, 0, 0],
        [9, 0, 0, 3, 0, 5, 0, 0, 1],
        [0, 0, 1, 8, 0, 6, 4, 0, 0],
        [0, 0, 8, 1, 0, 2, 9, 0, 0],
        [7, 0, 0, 0, 0, 0, 0, 0, 8],
        [0, 0, 6, 7, 0, 8, 2, 0, 0],
        [0, 0, 2, 6, 0, 9, 5, 0, 0],
        [8, 0, 0, 2, 0, 3, 0, 0, 9],
        [0, 0, 5, 0, 1, 0, 3, 0, 0]
      ],
      solution: [
        [4, 8, 3, 9, 2, 1, 6, 5, 7],
        [9, 6, 7, 3, 4, 5, 8, 2, 1],
        [2, 5, 1, 8, 7, 6, 4, 9, 3],
        [5, 4, 8, 1, 3, 2, 9, 7, 6],
        [7, 2, 9, 5, 6, 4, 1, 3, 8],
        [1, 3, 6, 7, 9, 8, 2, 4, 5],
        [3, 7, 2, 6, 8, 9, 5, 1, 4],
        [8, 1, 4, 2, 5, 3, 7, 6, 9],
        [6, 9, 5, 4, 1, 7, 3, 8, 2]
      ]
    },
    {
      initial: [
        [2, 0, 0, 0, 8, 0, 3, 0, 0],
        [0, 6, 0, 0, 7, 0, 0, 8, 4],
        [0, 3, 0, 5, 0, 0, 2, 0, 9],
        [0, 0, 0, 1, 0, 5, 4, 0, 8],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [4, 0, 2, 7, 0, 6, 0, 0, 0],
        [3, 0, 1, 0, 0, 7, 0, 4, 0],
        [7, 2, 0, 0, 4, 0, 0, 6, 0],
        [0, 0, 4, 0, 1, 0, 0, 0, 3]
      ],
      solution: [
        [2, 4, 5, 9, 8, 1, 3, 7, 6],
        [1, 6, 9, 2, 7, 3, 5, 8, 4],
        [8, 3, 7, 5, 6, 4, 2, 1, 9],
        [9, 7, 6, 1, 2, 5, 4, 3, 8],
        [5, 1, 3, 4, 9, 8, 6, 2, 7],
        [4, 8, 2, 7, 3, 6, 9, 5, 1],
        [3, 9, 1, 6, 5, 7, 8, 4, 2],
        [7, 2, 8, 3, 4, 9, 1, 6, 5],
        [6, 5, 4, 8, 1, 2, 7, 9, 3]
      ]
    }
  ],
  medium: [
    {
      initial: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0]
      ],
      solution: [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9]
      ]
    },
    {
      initial: [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0]
      ],
      solution: [
        [5, 8, 1, 6, 7, 2, 4, 3, 9],
        [7, 9, 2, 8, 4, 3, 6, 5, 1],
        [3, 6, 4, 5, 9, 1, 7, 8, 2],
        [4, 3, 8, 9, 5, 7, 2, 1, 6],
        [2, 5, 6, 1, 8, 4, 9, 7, 3],
        [1, 7, 9, 3, 2, 6, 8, 4, 5],
        [8, 4, 5, 2, 1, 9, 3, 6, 7],
        [9, 1, 3, 7, 6, 8, 5, 2, 4],
        [6, 2, 7, 4, 3, 5, 1, 9, 8]
      ]
    },
    {
      initial: [
        [0, 2, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 6, 0, 0, 0, 0, 3],
        [0, 7, 4, 0, 8, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 0, 2],
        [0, 8, 0, 0, 4, 0, 0, 1, 0],
        [6, 0, 0, 5, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 7, 8, 0],
        [5, 0, 0, 0, 0, 9, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 4, 0]
      ],
      solution: [
        [1, 2, 6, 4, 3, 7, 9, 5, 8],
        [8, 9, 5, 6, 2, 1, 4, 7, 3],
        [3, 7, 4, 9, 8, 5, 1, 2, 6],
        [4, 5, 7, 1, 9, 3, 8, 6, 2],
        [9, 8, 3, 2, 4, 6, 5, 1, 7],
        [6, 1, 2, 5, 7, 8, 3, 9, 4],
        [2, 6, 9, 3, 1, 4, 7, 8, 5],
        [5, 4, 8, 7, 6, 9, 2, 3, 1],
        [7, 3, 1, 8, 5, 2, 6, 4, 9]
      ]
    }
  ],
  hard: [
    {
      initial: [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0]
      ],
      solution: [
        [1, 2, 3, 6, 7, 8, 9, 4, 5],
        [5, 8, 4, 2, 3, 9, 7, 6, 1],
        [9, 6, 7, 1, 4, 5, 3, 2, 8],
        [3, 7, 2, 4, 6, 1, 5, 8, 9],
        [6, 9, 1, 5, 8, 3, 2, 7, 4],
        [4, 5, 8, 7, 9, 2, 6, 1, 3],
        [8, 3, 6, 9, 2, 4, 1, 5, 7],
        [2, 1, 9, 8, 5, 7, 4, 3, 6],
        [7, 4, 5, 3, 1, 6, 8, 9, 2]
      ]
    },
    {
      initial: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 8, 5],
        [0, 0, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 7, 0, 0, 0],
        [0, 0, 4, 0, 0, 0, 1, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [5, 0, 0, 0, 0, 0, 0, 7, 3],
        [0, 0, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 9]
      ],
      solution: [
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [2, 4, 6, 1, 7, 3, 9, 8, 5],
        [3, 5, 1, 9, 2, 8, 7, 4, 6],
        [1, 2, 8, 5, 3, 7, 6, 9, 4],
        [6, 3, 4, 8, 9, 2, 1, 5, 7],
        [7, 9, 5, 4, 6, 1, 8, 3, 2],
        [5, 1, 9, 2, 8, 6, 4, 7, 3],
        [4, 7, 2, 3, 1, 9, 5, 6, 8],
        [8, 6, 3, 7, 4, 5, 2, 1, 9]
      ]
    },
    {
      initial: [
        [0, 0, 5, 3, 0, 0, 0, 0, 0],
        [8, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 7, 0, 0, 1, 0, 5, 0, 0],
        [4, 0, 0, 0, 0, 5, 3, 0, 0],
        [0, 1, 0, 0, 7, 0, 0, 0, 6],
        [0, 0, 3, 2, 0, 0, 0, 8, 0],
        [0, 6, 0, 5, 0, 0, 0, 0, 9],
        [0, 0, 4, 0, 0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0, 9, 7, 0, 0]
      ],
      solution: [
        [1, 4, 5, 3, 2, 7, 6, 9, 8],
        [8, 3, 9, 6, 5, 4, 1, 2, 7],
        [6, 7, 2, 9, 1, 8, 5, 4, 3],
        [4, 9, 6, 1, 8, 5, 3, 7, 2],
        [2, 1, 8, 4, 7, 3, 9, 5, 6],
        [7, 5, 3, 2, 9, 6, 4, 8, 1],
        [3, 6, 7, 5, 4, 2, 8, 1, 9],
        [9, 8, 4, 7, 6, 1, 2, 3, 5],
        [5, 2, 1, 8, 3, 9, 7, 6, 4]
      ]
    }
  ]
};

export default function SudokuGame() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errors, setErrors] = useState<boolean[][]>([]);

  const startNewGame = (diff = difficulty) => {
    const puzzles = SUDOKU_PUZZLES[diff];
    const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    const initial = puzzle.initial.map(row => [...row]);
    const sol = puzzle.solution.map(row => [...row]);
    const current = puzzle.initial.map(row => [...row]);
    const errs = Array(9).fill(false).map(() => Array(9).fill(false));

    setInitialBoard(initial);
    setSolution(sol);
    setBoard(current);
    setErrors(errs);
    setSelectedCell(null);
    setIsCompleted(false);
  };

  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (initialBoard[r][c] !== 0) return; // Fixed initial cell
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isCompleted) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check if error
    const newErrors = errors.map(row => [...row]);
    newErrors[r][c] = num !== 0 && num !== solution[r][c];
    setErrors(newErrors);

    // Check completion
    let complete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newBoard[i][j] !== solution[i][j]) {
          complete = false;
          break;
        }
      }
    }
    if (complete) setIsCompleted(true);
  };

  const giveHint = () => {
    if (!selectedCell || isCompleted) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;
    handleNumberInput(solution[r][c]);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
      <div className="flex justify-between items-center w-full mb-6 glass p-4 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🧩 Sudoku
        </h2>

        {/* Difficulty selector */}
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                difficulty === d ? 'bg-green-500 text-black' : 'bg-black/40 text-gray-400 hover:text-white'
              }`}
            >
              {d === 'easy' ? 'Kolay' : d === 'medium' ? 'Orta' : 'Zor'}
            </button>
          ))}
        </div>
      </div>

      {isCompleted && (
        <div className="mb-4 bg-green-900/40 border border-green-500/50 p-4 rounded-2xl text-center animate-bounce">
          <div className="text-green-400 font-bold text-lg">🎉 Tebrikler! Sudoku'yu Çözdünüz!</div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-9 gap-1 bg-green-900/30 p-2 rounded-2xl border border-green-500/30 shadow-2xl mb-6">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isInitial = initialBoard[r][c] !== 0;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isError = errors[r]?.[c];
            const isSameBlock = selectedCell && (
              Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)
            );
            const isSameRowOrCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                  isSelected
                    ? 'bg-green-500 text-black ring-2 ring-white scale-105 z-10'
                    : isError
                    ? 'bg-red-900/80 text-red-200 border border-red-500'
                    : isInitial
                    ? 'bg-stone-800 text-white font-black'
                    : val !== 0
                    ? 'bg-stone-900 text-green-400 font-bold'
                    : isSameBlock || isSameRowOrCol
                    ? 'bg-stone-900/60 text-gray-400'
                    : 'bg-stone-950/80 text-gray-400 hover:bg-stone-900'
                } ${
                  (c === 2 || c === 5) ? 'mr-1' : ''
                } ${
                  (r === 2 || r === 5) ? 'mb-1' : ''
                }`}
              >
                {val !== 0 ? val : ''}
              </button>
            );
          })
        )}
      </div>

      {/* Number Pad */}
      <div className="flex gap-2 justify-center mb-6 w-full flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-green-900/40 border border-green-900/40 hover:border-green-500/50 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-all active:scale-95 shadow-md"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleNumberInput(0)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-red-900/30 hover:bg-red-900/60 border border-red-500/30 rounded-xl text-red-300 font-bold text-sm flex items-center justify-center transition-all"
          title="Temizle"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={giveHint}
          disabled={!selectedCell || isCompleted}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          <Lightbulb size={16} /> İpucu
        </button>
        <button
          onClick={() => startNewGame(difficulty)}
          className="flex items-center gap-2 px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 text-green-300 rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw size={16} /> Yeni Oyuna Başla
        </button>
      </div>
    </div>
  );
}
