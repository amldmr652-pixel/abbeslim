'use client';

import { useState, useEffect } from 'react';
import { Target, Flame, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGoalStore, Goal } from '@/stores/useGoalStore';
import { useHabitStore, Habit } from '@/stores/useHabitStore';
import { createClient } from '@/utils/supabase/client';

export default function GoalsPage() {
  const { t } = useTranslation();
  const { goals, fetchGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  const { habits, fetchHabits, addHabit, checkInHabit, deleteHabit } = useHabitStore();
  
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('goals');
  const [userId, setUserId] = useState<string | null>(null);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  // Habit Form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    fetchGoals();
    fetchHabits();
    
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [fetchGoals, fetchHabits]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !goalTitle.trim()) return;
    
    await addGoal({
      user_id: userId,
      title: goalTitle,
      progress: goalProgress,
      color: 'bg-green-500'
    });
    
    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalProgress(0);
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !habitTitle.trim()) return;

    await addHabit({
      user_id: userId,
      title: habitTitle,
      frequency: habitFreq,
      streak: 0,
      color: 'bg-blue-500',
      last_completed: null
    });

    setIsHabitModalOpen(false);
    setHabitTitle('');
    setHabitFreq('daily');
  };

  const isHabitCompletedToday = (habit: Habit) => {
    if (!habit.last_completed) return false;
    const lastDate = new Date(habit.last_completed).toDateString();
    const today = new Date().toDateString();
    return lastDate === today;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Target className="text-green-500" size={32} />
          {t('goals.title')}
        </h1>
        <p className="text-gray-400 mt-2">{t('goals.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-green-900/30 pb-4">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeTab === 'goals' 
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          {t('goals.goalsTab')}
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
            activeTab === 'habits' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          <Flame size={18} className={activeTab === 'habits' ? 'text-orange-300' : 'text-gray-500'} />
          {t('goals.habitsTab')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'goals' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{t('goals.goalsTab')}</h2>
            <Button onClick={() => setIsGoalModalOpen(true)} className="flex items-center gap-2" size="sm">
              <Plus size={16} /> {t('goals.newGoal')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-10 glass rounded-3xl">
                {t('goals.noGoals')}
              </div>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id} className="relative group overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-white text-lg">{goal.title}</h3>
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{t('goals.progress')}</span>
                      <span className="text-green-400 font-bold">{goal.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${goal.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                     <button 
                       onClick={() => updateGoal(goal.id, { progress: Math.min(100, goal.progress + 10) })}
                       className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-gray-300 transition-colors"
                     >
                       +10%
                     </button>
                     <button 
                       onClick={() => updateGoal(goal.id, { progress: Math.min(100, goal.progress + 25) })}
                       className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-gray-300 transition-colors"
                     >
                       +25%
                     </button>
                     {goal.progress === 100 && (
                       <span className="text-xs text-green-400 flex items-center ml-auto">
                         <CheckCircle2 size={14} className="mr-1" /> Tamamlandı
                       </span>
                     )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'habits' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{t('goals.habitsTab')}</h2>
            <Button onClick={() => setIsHabitModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500" size="sm">
              <Plus size={16} /> {t('goals.newHabit')}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {habits.length === 0 ? (
              <div className="text-center text-gray-500 py-10 glass rounded-3xl">
                {t('goals.noHabits')}
              </div>
            ) : (
              habits.map((habit) => {
                const completedToday = isHabitCompletedToday(habit);
                return (
                  <div key={habit.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => !completedToday && checkInHabit(habit.id)}
                        disabled={completedToday}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          completedToday 
                            ? 'bg-blue-600 text-white cursor-default' 
                            : 'bg-black/50 border border-blue-500/30 text-gray-500 hover:border-blue-500 hover:text-blue-400'
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      
                      <div>
                        <h3 className={`font-semibold text-lg transition-colors ${completedToday ? 'text-blue-200' : 'text-white'}`}>
                          {habit.title}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {habit.frequency === 'daily' ? t('goals.daily') : t('goals.weekly')} 
                          <span className="mx-1">•</span> 
                          {completedToday ? t('goals.alreadyCompleted') : t('goals.markCompleted')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-orange-400 bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-500/20">
                        <Flame size={16} className={habit.streak > 0 ? 'animate-pulse' : 'opacity-50'} />
                        <span className="font-bold text-sm">{habit.streak} {t('goals.streak')}</span>
                      </div>
                      
                      <button 
                        onClick={() => deleteHabit(habit.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={t('goals.newGoal')} maxWidth="sm">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('goals.goalName')}</label>
            <Input 
              value={goalTitle}
              onChange={(val) => setGoalTitle(val as string)}
              placeholder="Örn: 10 kitap okumak"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('goals.progress')} (%)</label>
            <Input 
              type="number"
              value={goalProgress.toString()}
              onChange={(val) => setGoalProgress(Number(val))}
              required
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      {/* Habit Modal */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title={t('goals.newHabit')} maxWidth="sm">
        <form onSubmit={handleAddHabit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('goals.habitName')}</label>
            <Input 
              value={habitTitle}
              onChange={(val) => setHabitTitle(val as string)}
              placeholder="Örn: Sabah koşusu"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">{t('goals.frequency')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHabitFreq('daily')}
                className={`flex-1 py-2 rounded-xl text-sm transition-all ${habitFreq === 'daily' ? 'bg-blue-600 text-white' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.daily')}
              </button>
              <button
                type="button"
                onClick={() => setHabitFreq('weekly')}
                className={`flex-1 py-2 rounded-xl text-sm transition-all ${habitFreq === 'weekly' ? 'bg-blue-600 text-white' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.weekly')}
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">{t('common.add')}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
