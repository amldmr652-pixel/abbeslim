'use client';

import { useEffect } from 'react';
import { Flame, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import Link from 'next/link';
import { useHabitStore } from '@/stores/useHabitStore';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function HabitsWidget() {
  const { t } = useTranslation();
  const { habits, fetchHabits, checkInHabit, uncheckHabit } = useHabitStore();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Sadece günlük alışkanlıkları göster, scheduled_time'a göre sırala
  const dailyHabits = habits
    .filter(h => h.frequency === 'daily')
    .sort((a, b) => {
      if (!a.scheduled_time && !b.scheduled_time) return 0;
      if (!a.scheduled_time) return 1;
      if (!b.scheduled_time) return -1;
      return a.scheduled_time.localeCompare(b.scheduled_time);
    })
    .slice(0, 15); // Tüm günlük rutinlerin sığabilmesi için kapasiteyi artırdık

  const isCompletedToday = (lastCompleted: string | null) => {
    if (!lastCompleted) return false;
    return new Date(lastCompleted).toDateString() === new Date().toDateString();
  };

  const completedCount = dailyHabits.filter(h => isCompletedToday(h.last_completed)).length;
  const totalCount = dailyHabits.length;

  if (dailyHabits.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Flame size={18} className="text-orange-400" /> Günlük Rutinler
        </h2>
        <p className="text-gray-500 text-sm text-center py-6">
          Henüz günlük alışkanlık eklenmedi.
        </p>
        <div className="pt-3 border-t border-green-900/20">
          <Link href="/goals" className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors w-fit">
            Alışkanlık Ekle <ChevronRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Flame size={18} className="text-orange-400" /> Günlük Rutinler
        </h2>
        <span className="text-xs font-bold bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-700"
          style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
        />
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
        {dailyHabits.map(habit => {
          const done = isCompletedToday(habit.last_completed);
          return (
            <div 
              key={habit.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                done ? 'bg-green-500/5 border border-green-500/10' : 'hover:bg-white/3'
              }`}
            >
              <button
                onClick={() => done ? uncheckHabit(habit.id) : checkInHabit(habit.id)}
                title={done ? 'İşareti kaldır (Geri al)' : 'Tamamlandı olarak işaretle'}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  done
                    ? 'bg-green-500 text-stone-950 hover:bg-red-500 hover:text-white'
                    : 'border border-gray-700 text-gray-600 hover:border-green-500 hover:text-green-400'
                }`}
              >
                <CheckCircle2 size={14} />
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${done ? 'text-green-300 line-through opacity-60' : 'text-white'}`}>
                  {habit.title}
                </p>
              </div>

              {habit.scheduled_time && (
                <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                  <Clock size={10} />
                  {habit.scheduled_time.slice(0, 5)}
                </span>
              )}

              {habit.streak > 0 && (
                <span className="text-xs text-orange-400 font-bold shrink-0 flex items-center gap-0.5">
                  <Flame size={10} /> {habit.streak}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-green-900/20">
        <Link href="/goals" className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors w-fit">
          Tüm Alışkanlıklar <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    </Card>
  );
}
