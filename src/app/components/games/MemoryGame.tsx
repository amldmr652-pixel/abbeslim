'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Ghost, Star, Heart, Moon, Sun, Cloud, Snowflake, Flame } from 'lucide-react';

const ICONS = [Ghost, Star, Heart, Moon, Sun, Cloud, Snowflake, Flame];

interface Card {
  id: number;
  iconId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const initGame = () => {
    const duplicatedIcons = [...ICONS, ...ICONS];
    const shuffled = duplicatedIcons
      .map((_, index) => ({ iconId: index % ICONS.length, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item, index) => ({
        id: index,
        iconId: item.iconId,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsLocked(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      if (cards[newFlipped[0]].iconId === cards[newFlipped[1]].iconId) {
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[newFlipped[0]].isMatched = true;
          matchedCards[newFlipped[1]].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches(m => m + 1);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[newFlipped[0]].isFlipped = false;
          resetCards[newFlipped[1]].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isGameOver = matches === ICONS.length;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-xl font-bold text-white flex justify-between w-full max-w-[400px]">
        <span>{t('games.memory')}</span>
        <div className="flex gap-4 text-sm items-center">
          <span className="text-blue-400">Hamle: {moves}</span>
          <span className="text-green-400">Eşleşme: {matches}/{ICONS.length}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 bg-black/30 p-4 rounded-2xl border border-blue-900/30">
        {cards.map((card, index) => {
          const Icon = ICONS[card.iconId];
          const isVisible = card.isFlipped || card.isMatched;
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`
                w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 transform perspective-1000
                ${isVisible 
                  ? card.isMatched 
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-transparent border border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div 
                className="transition-transform duration-500"
                style={{ transform: isVisible ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
              >
                <Icon size={32} className={!isVisible ? 'opacity-0' : 'opacity-100'} />
              </div>
            </button>
          );
        })}
      </div>

      {isGameOver && (
        <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold text-green-400 mb-2">{t('games.youWin')}</h2>
          <p className="text-gray-400 mb-4">{moves} hamlede bitirdin!</p>
          <button 
            onClick={initGame}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
          >
            {t('games.restart')}
          </button>
        </div>
      )}
      
      {!isGameOver && (
        <p className="mt-8 text-sm text-gray-500">{t('games.memoryDesc')}</p>
      )}
    </div>
  );
}
