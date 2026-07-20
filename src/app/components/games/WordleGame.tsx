'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

const WORDLE_WORDS = [
  "KALEM", "KİTAP", "NOTLAR", "DERSİ", "DOSYA", "METİN", "EKRAN", "SİSTEM",
  "YAZAR", "BİLGİ", "AKILL", "BEYİN", "HAFTA", "RUTİN", "BAŞAR", "ODAKL",
  "TAKİP", "TARİH", "HEDEF", "SÜREÇ", "KURAL", "VERİM", "TABLO", "KODLA"
];

export default function WordleGame() {
  const { t } = useTranslation();

  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const startNewGame = () => {
    const randomWord = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleKeyPress = (char: string) => {
    if (isGameOver) return;

    if (char === 'ENTER') {
      if (currentGuess.length === 5) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === targetWord) {
          setIsWon(true);
          setIsGameOver(true);
        } else if (newGuesses.length === 6) {
          setIsGameOver(true);
        }
      }
    } else if (char === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + char);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACK');
      } else {
        const char = e.key.toUpperCase();
        if (/^[A-ZÇĞİÖŞÜ]$/.test(char)) {
          handleKeyPress(char);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isGameOver, targetWord, guesses]);

  const getCharColor = (word: string, idx: number) => {
    const char = word[idx];
    if (targetWord[idx] === char) return 'bg-green-600 text-white border-green-500';
    if (targetWord.includes(char)) return 'bg-yellow-600 text-white border-yellow-500';
    return 'bg-stone-800 text-gray-400 border-stone-700';
  };

  const KEYBOARD_ROWS = [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'BACK']
  ];

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      <div className="flex justify-between items-center w-full mb-6 glass p-4 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🎨 Kelime Tahmin (Wordle)
        </h2>
        <button
          onClick={startNewGame}
          className="p-2 glass text-gray-300 hover:text-white rounded-xl transition-colors"
          title="Yeniden Başlat"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {isGameOver && (
        <div className={`w-full p-4 rounded-2xl text-center mb-4 border ${isWon ? 'bg-green-900/40 border-green-500 text-green-300' : 'bg-red-900/40 border-red-500 text-red-300'}`}>
          <div className="font-bold text-lg mb-1">
            {isWon ? '🎉 Harika! Kelimeyi Bildiniz!' : `Bilemediniz! Doğru Kelime: ${targetWord}`}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-rows-6 gap-2 mb-6 w-full max-w-[320px]">
        {Array.from({ length: 6 }).map((_, rIdx) => {
          const guess = guesses[rIdx] || (rIdx === guesses.length ? currentGuess : '');
          const isSubmitted = rIdx < guesses.length;

          return (
            <div key={rIdx} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, cIdx) => {
                const char = guess[cIdx] || '';
                const styleClass = isSubmitted
                  ? getCharColor(guess, cIdx)
                  : char
                  ? 'border-green-500/80 bg-stone-900 text-white font-bold'
                  : 'border-white/10 bg-black/40 text-white';

                return (
                  <div
                    key={cIdx}
                    className={`h-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all ${styleClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5 w-full">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  key === 'ENTER' || key === 'BACK'
                    ? 'px-3 bg-stone-800 text-gray-300 hover:bg-stone-700'
                    : 'flex-1 bg-stone-900 text-white hover:bg-stone-800 border border-white/5'
                }`}
              >
                {key === 'BACK' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
