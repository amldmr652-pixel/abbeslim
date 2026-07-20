'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Timer, Zap, Trophy } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Question {
  num1: number;
  num2: number;
  op: '+' | '-' | '×';
  answer: number;
}

export default function MathRaceGame() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);

  const generateQuestion = (): Question => {
    const ops = ['+', '-', '×'] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1 = Math.floor(Math.random() * 20) + 1;
    let n2 = Math.floor(Math.random() * 20) + 1;
    let ans = 0;

    if (op === '+') ans = n1 + n2;
    else if (op === '-') {
      if (n1 < n2) [n1, n2] = [n2, n1];
      ans = n1 - n2;
    } else {
      n1 = Math.floor(Math.random() * 12) + 1;
      n2 = Math.floor(Math.random() * 10) + 1;
      ans = n1 * n2;
    }

    return { num1: n1, num2: n2, op, answer: ans };
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(45);
    setIsPlaying(true);
    setIsFinished(false);
    setUserAnswer('');
    setQuestion(generateQuestion());
  };

  useEffect(() => {
    let timer: any = null;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setIsFinished(true);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !isPlaying) return;

    const parsed = parseInt(userAnswer, 10);
    if (parsed === question.answer) {
      const addedScore = 10 + streak * 2;
      setScore(prev => prev + addedScore);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setUserAnswer('');
    setQuestion(generateQuestion());
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      <div className="flex justify-between items-center w-full mb-6 glass p-4 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🧮 Matematik Yarışı
        </h2>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
          <span className="flex items-center gap-1 text-yellow-400">
            <Timer size={16} /> {timeLeft}s
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <Zap size={16} /> {score} Puan
          </span>
        </div>
      </div>

      {isFinished ? (
        <div className="w-full glass p-8 rounded-3xl border border-green-500/30 text-center mb-6 space-y-4">
          <Trophy size={48} className="text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-bold text-white">Süre Bitti!</h3>
          <div className="text-3xl font-black text-green-400">{score} Puan</div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-stone-950 rounded-2xl font-bold transition-all shadow-lg"
          >
            Tekrar Oyna
          </button>
        </div>
      ) : isPlaying && question ? (
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
          {/* Question card */}
          <div className="w-full glass p-8 rounded-3xl border border-green-500/30 text-center shadow-2xl relative">
            {streak > 2 && (
              <span className="absolute top-3 right-4 text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full animate-pulse">
                🔥 {streak}x Seri Bonus!
              </span>
            )}
            <div className="text-5xl font-black text-white tracking-widest my-4">
              {question.num1} {question.op} {question.num2} = ?
            </div>
          </div>

          <input
            autoFocus
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Cevabınız..."
            className="w-full bg-black/60 border-2 border-green-900/50 focus:border-green-500 rounded-2xl p-4 text-center text-white text-3xl font-bold outline-none"
          />

          <button
            type="submit"
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-stone-950 font-black rounded-2xl text-lg transition-all shadow-lg active:scale-98"
          >
            Gönder ➔
          </button>
        </form>
      ) : (
        <div className="w-full glass p-8 rounded-3xl border border-white/10 text-center space-y-6">
          <p className="text-gray-300">
            45 saniye içinde olabildiğince çok matematik sorusunu doğru yanıtlayın.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-green-500 hover:bg-green-400 text-stone-950 font-black rounded-2xl text-lg transition-all shadow-lg"
          >
            Oyunu Başlat
          </button>
        </div>
      )}
    </div>
  );
}
