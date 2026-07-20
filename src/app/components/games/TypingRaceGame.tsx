'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Zap, Trophy, Timer } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

const WORD_POOLS = {
  tr: [
    "notlar", "yapay", "zeka", "bilgisayar", "yazılım", "ders", "kütüphane", "arama",
    "odaklanma", "hedef", "zaman", "başarı", "takvim", "görev", "çalışma", "akıllı",
    "hızlı", "öğrenme", "sistem", "kodlama", "tasarım", "geliştirme", "yeni", "nesil",
    "dünya", "bilgi", "gelecek", "teknoloji", "üretkenlik", "mantık", "proje", "verim"
  ],
  en: [
    "notes", "artificial", "intelligence", "computer", "software", "lesson", "library", "search",
    "focus", "target", "time", "success", "calendar", "task", "study", "smart",
    "speed", "learning", "system", "coding", "design", "development", "next", "gen",
    "world", "knowledge", "future", "technology", "productivity", "logic", "project", "yield"
  ],
  ar: [
    "ملاحظات", "ذكاء", "اصطناعي", "حاسوب", "برمجيات", "درس", "مكتبة", "بحث",
    "تركيز", "هدف", "وقت", "نجاح", "تقويم", "مهمة", "دراسة", "ذكي",
    "سرعة", "تعلم", "نظام", "برمجة", "تصميم", "تطوير", "جيل", "جديد"
  ]
};

export default function TypingRaceGame() {
  const { t, language } = useTranslation();
  const langKey = (language === 'tr' || language === 'ar') ? language : 'en';
  const pool = WORD_POOLS[langKey] || WORD_POOLS.tr;

  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const generateWords = () => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const result: string[] = [];
    while (result.length < 60) {
      result.push(...shuffled);
    }
    return result.slice(0, 60);
  };

  const startGame = () => {
    setWords(generateWords());
    setCurrentWordIndex(0);
    setInputVal('');
    setCorrectCount(0);
    setTotalTyped(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setIsFinished(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    setWords(generateWords());
  }, [language]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isPlaying && !isFinished) {
      setIsPlaying(true);
    }

    if (val.endsWith(' ')) {
      const typedWord = val.trim();
      const targetWord = words[currentWordIndex];

      if (typedWord === targetWord) {
        setCorrectCount(prev => prev + 1);
      }
      setTotalTyped(prev => prev + 1);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
    } else {
      setInputVal(val);
    }
  };

  const wpm = Math.round((correctCount / ((60 - timeLeft) || 1)) * 60);
  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 100) : 100;

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center w-full mb-6 glass p-4 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⌨️ Hızlı Yazma Yarışı
        </h2>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
          <span className="flex items-center gap-1 text-yellow-400">
            <Timer size={16} /> {timeLeft}s
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <Zap size={16} /> {wpm} WPM
          </span>
        </div>
      </div>

      {isFinished ? (
        <div className="w-full glass p-8 rounded-3xl border border-green-500/30 text-center mb-6 space-y-4">
          <Trophy size={48} className="text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-bold text-white">Yarış Bitti!</h3>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="glass p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-green-400">{wpm}</div>
              <div className="text-xs text-gray-400 font-bold uppercase">WPM (Kelime/Dk)</div>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-blue-400">%{accuracy}</div>
              <div className="text-xs text-gray-400 font-bold uppercase">Doğruluk Oranı</div>
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-stone-950 rounded-2xl font-bold transition-all shadow-lg text-base"
          >
            Tekrar Oyna
          </button>
        </div>
      ) : (
        <>
          {/* Word box */}
          <div className="w-full glass p-6 rounded-3xl border border-white/10 mb-6 min-h-[140px] flex flex-wrap gap-2.5 items-center justify-center text-lg font-medium overflow-hidden">
            {words.slice(Math.max(0, currentWordIndex - 2), currentWordIndex + 12).map((w, idx) => {
              const actualIdx = Math.max(0, currentWordIndex - 2) + idx;
              const isCurrent = actualIdx === currentWordIndex;
              const isPassed = actualIdx < currentWordIndex;

              return (
                <span
                  key={actualIdx}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-green-500 text-stone-950 font-black scale-110 shadow-lg'
                      : isPassed
                      ? 'text-gray-600 line-through opacity-50'
                      : 'text-gray-300'
                  }`}
                >
                  {w}
                </span>
              );
            })}
          </div>

          {/* Input field */}
          <div className="w-full mb-6">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              disabled={isFinished}
              placeholder={isPlaying ? 'Yazmaya devam edin (Boşluk ile sonraki kelime)...' : 'Yazmaya başlamak için buraya yazın...'}
              className="w-full bg-black/60 border-2 border-green-900/50 focus:border-green-500 rounded-2xl p-4 px-6 text-white text-xl outline-none transition-all text-center font-bold"
            />
          </div>

          <button
            onClick={startGame}
            className="flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-2xl font-bold transition-all"
          >
            <RefreshCw size={18} /> Oyunu Yeniden Başlat
          </button>
        </>
      )}
    </div>
  );
}
