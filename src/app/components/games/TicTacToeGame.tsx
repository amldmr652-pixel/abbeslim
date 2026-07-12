'use client';
import { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { X, Circle } from 'lucide-react';

type Player = 'X' | 'O' | null;

export default function TicTacToeGame() {
  const { t } = useTranslation();
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const winInfo = calculateWinner(board);
  const winner = winInfo?.winner;
  const winningLine = winInfo?.line || [];
  const isDraw = !winner && board.every(square => square !== null);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;

    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 text-xl font-bold text-white flex justify-between w-full max-w-[320px]">
        <span>{t('games.tictactoe')}</span>
        <div className="flex gap-2 items-center text-sm">
          {!winner && !isDraw && (
            <span className={xIsNext ? 'text-purple-400' : 'text-fuchsia-400'}>
              Sıra: {xIsNext ? 'X' : 'O'}
            </span>
          )}
          {winner && <span className="text-green-400">Kazanan: {winner}</span>}
          {isDraw && <span className="text-yellow-400">Berabere!</span>}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-black/40 p-4 rounded-3xl border border-purple-900/30">
        {board.map((square, i) => {
          const isWinningSquare = winningLine.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`
                w-24 h-24 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300
                ${!square && !winner ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                ${isWinningSquare ? 'bg-green-600/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-white/5'}
                border border-white/10 hover:border-white/20
              `}
            >
              {square === 'X' && (
                <X size={48} className={`animate-in zoom-in-50 duration-300 ${isWinningSquare ? 'text-green-400' : 'text-purple-400'}`} strokeWidth={2.5} />
              )}
              {square === 'O' && (
                <Circle size={40} className={`animate-in zoom-in-50 duration-300 ${isWinningSquare ? 'text-green-400' : 'text-fuchsia-400'}`} strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>

      {(winner || isDraw) && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
          >
            {t('games.restart')}
          </button>
        </div>
      )}
      
      {!(winner || isDraw) && (
        <p className="mt-8 text-sm text-gray-500">{t('games.tictactoeDesc')}</p>
      )}
    </div>
  );
}
