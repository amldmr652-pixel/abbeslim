'use client';

import { useState, useEffect } from 'react';
import { Target, Flame, Plus, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGoalStore, Goal } from '@/stores/useGoalStore';
import { useHabitStore, Habit } from '@/stores/useHabitStore';
import { createClient } from '@/utils/supabase/client';

export default function GoalsPage() {
  const { t } = useTranslation();
  const { goals, fetchGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  const { habits, fetchHabits, addHabit, updateHabit, checkInHabit, deleteHabit } = useHabitStore();
  
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('goals');
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // New Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Edit Modals
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalProgress, setEditGoalProgress] = useState(0);

  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitFreq, setEditHabitFreq] = useState<'daily' | 'weekly'>('daily');

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  // New Habit Form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchGoals();
        fetchHabits();
      }
      setLoadingUser(false);
    };
    getUser();
  }, [fetchGoals, fetchHabits]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !goalTitle.trim()) return;
    
    await addGoal({
      user_id: userId,
      title: goalTitle.trim(),
      progress: goalProgress,
      color: 'bg-green-500'
    });
    
    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalProgress(0);
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditGoalTitle(goal.title);
    setEditGoalProgress(goal.progress);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !editGoalTitle.trim()) return;

    await updateGoal(selectedGoal.id, {
      title: editGoalTitle.trim(),
      progress: editGoalProgress
    });

    setIsEditGoalModalOpen(false);
    setSelectedGoal(null);
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !habitTitle.trim()) return;

    await addHabit({
      user_id: userId,
      title: habitTitle.trim(),
      frequency: habitFreq,
      streak: 0,
      color: 'bg-blue-500',
      last_completed: null
    });

    setIsHabitModalOpen(false);
    setHabitTitle('');
    setHabitFreq('daily');
  };

  const handleOpenEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setEditHabitTitle(habit.title);
    setEditHabitFreq(habit.frequency);
    setIsEditHabitModalOpen(true);
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabit || !editHabitTitle.trim()) return;

    await updateHabit(selectedHabit.id, {
      title: editHabitTitle.trim(),
      frequency: editHabitFreq
    });

    setIsEditHabitModalOpen(false);
    setSelectedHabit(null);
  };

  const isHabitCompletedToday = (habit: Habit) => {
    if (!habit.last_completed) return false;
    const lastDate = new Date(habit.last_completed).toDateString();
    const today = new Date().toDateString();
    return lastDate === today;
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-white">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
        <p className="text-gray-400">Hedeflerinizi ve alışkanlıklarınızı görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Target className="text-green-500" size={32} />
          {t('goals.title') || 'Hedefler & Alışkanlıklar'}
        </h1>
        <p className="text-gray-400 mt-2">{t('goals.subtitle') || 'Gelişiminizi planlayın ve takip edin'}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-green-900/20 pb-4">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeTab === 'goals' 
              ? 'bg-green-500 text-stone-950 shadow-md font-bold' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          {t('goals.goalsTab') || 'Hedefler'}
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
            activeTab === 'habits' 
              ? 'bg-blue-500 text-stone-950 shadow-md font-bold' 
              : 'text-gray-400 hover:text-white glass'
          }`}
        >
          <Flame size={18} className={activeTab === 'habits' ? 'text-orange-950' : 'text-gray-500'} />
          {t('goals.habitsTab') || 'Alışkanlıklar'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'goals' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{t('goals.goalsTab') || 'Hedeflerim'}</h2>
            <Button onClick={() => setIsGoalModalOpen(true)} className="flex items-center gap-2" size="sm">
              <Plus size={16} /> {t('goals.newGoal') || 'Yeni Hedef'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-10 glass rounded-3xl">
                {t('goals.noGoals') || 'Henüz eklenmiş hedef yok.'}
              </div>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id} className="relative group overflow-hidden border border-green-900/10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditGoal(goal)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Bu hedefi silmek istediğinizden emin misiniz?')) deleteGoal(goal.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{t('goals.progress') || 'Gelişim'}</span>
                      <span className="text-green-400 font-bold">{goal.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${goal.color || 'bg-green-500'} rounded-full transition-all duration-1000`}
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
                       <span className="text-xs text-green-400 flex items-center ml-auto font-semibold">
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
            <h2 className="text-xl font-bold text-white">{t('goals.habitsTab') || 'Alışkanlıklarım'}</h2>
            <Button onClick={() => setIsHabitModalOpen(true)} className="flex items-center gap-2 bg-blue-500 text-stone-950 font-bold hover:bg-blue-400" size="sm">
              <Plus size={16} /> {t('goals.newHabit') || 'Yeni Alışkanlık'}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {habits.length === 0 ? (
              <div className="text-center text-gray-500 py-10 glass rounded-3xl">
                {t('goals.noHabits') || 'Henüz alışkanlık eklenmedi.'}
              </div>
            ) : (
              habits.map((habit) => {
                const completedToday = isHabitCompletedToday(habit);
                return (
                  <div key={habit.id} className="glass p-4 rounded-2xl flex items-center justify-between group border border-blue-900/5">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => !completedToday && checkInHabit(habit.id)}
                        disabled={completedToday}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          completedToday 
                            ? 'bg-blue-500 text-stone-950 cursor-default font-bold shadow-md shadow-blue-500/20' 
                            : 'bg-black/50 border border-blue-500/30 text-gray-500 hover:border-blue-500 hover:text-blue-400'
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      
                      <div>
                        <h3 className={`font-semibold text-base transition-colors ${completedToday ? 'text-blue-300' : 'text-white'}`}>
                          {habit.title}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {habit.frequency === 'daily' ? (t('goals.daily') || 'Günlük') : (t('goals.weekly') || 'Haftalık')} 
                          <span className="mx-1">•</span> 
                          {completedToday ? (t('goals.alreadyCompleted') || 'Bugün tamamlandı') : (t('goals.markCompleted') || 'Tamamlandı olarak işaretle')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-orange-400 bg-orange-950/20 px-3 py-1.5 rounded-full border border-orange-500/10">
                        <Flame size={16} className={habit.streak > 0 ? 'animate-pulse' : 'opacity-50'} />
                        <span className="font-bold text-xs">{habit.streak} {t('goals.streak') || 'gün'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditHabit(habit)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Bu alışkanlığı silmek istediğinizden emin misiniz?')) deleteHabit(habit.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Goal Add Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={t('goals.newGoal') || 'Yeni Hedef'} maxWidth="sm">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.goalName') || 'Hedef Adı'}</label>
            <Input 
              value={goalTitle}
              onChange={setGoalTitle}
              placeholder="Örn: 10 kitap okumak"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.progress') || 'Başlangıç İlerlemesi'} (%)</label>
            <Input 
              type="number"
              value={goalProgress.toString()}
              onChange={(val) => setGoalProgress(Number(val))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsGoalModalOpen(false)}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit">{t('common.add') || 'Ekle'}</Button>
          </div>
        </form>
      </Modal>

      {/* Goal Edit Modal */}
      <Modal isOpen={isEditGoalModalOpen} onClose={() => { setIsEditGoalModalOpen(false); setSelectedGoal(null); }} title="Hedefi Düzenle" maxWidth="sm">
        <form onSubmit={handleUpdateGoal} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.goalName') || 'Hedef Adı'}</label>
            <Input 
              value={editGoalTitle}
              onChange={setEditGoalTitle}
              placeholder="Örn: 10 kitap okumak"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.progress') || 'İlerleme'} (%)</label>
            <Input 
              type="number"
              value={editGoalProgress.toString()}
              onChange={(val) => setEditGoalProgress(Number(val))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => { setIsEditGoalModalOpen(false); setSelectedGoal(null); }}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit">Güncelle</Button>
          </div>
        </form>
      </Modal>

      {/* Habit Add Modal */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title={t('goals.newHabit') || 'Yeni Alışkanlık'} maxWidth="sm">
        <form onSubmit={handleAddHabit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.habitName') || 'Alışkanlık Adı'}</label>
            <Input 
              value={habitTitle}
              onChange={setHabitTitle}
              placeholder="Örn: Sabah koşusu"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.frequency') || 'Sıklık'}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHabitFreq('daily')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${habitFreq === 'daily' ? 'bg-blue-500 text-stone-950 font-bold' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.daily') || 'Günlük'}
              </button>
              <button
                type="button"
                onClick={() => setHabitFreq('weekly')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${habitFreq === 'weekly' ? 'bg-blue-500 text-stone-950 font-bold' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.weekly') || 'Haftalık'}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsHabitModalOpen(false)}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" className="bg-blue-500 text-stone-950 font-bold hover:bg-blue-400">{t('common.add') || 'Ekle'}</Button>
          </div>
        </form>
      </Modal>

      {/* Habit Edit Modal */}
      <Modal isOpen={isEditHabitModalOpen} onClose={() => { setIsEditHabitModalOpen(false); setSelectedHabit(null); }} title="Alışkanlığı Düzenle" maxWidth="sm">
        <form onSubmit={handleUpdateHabit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.habitName') || 'Alışkanlık Adı'}</label>
            <Input 
              value={editHabitTitle}
              onChange={setEditHabitTitle}
              placeholder="Örn: Sabah koşusu"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">{t('goals.frequency') || 'Sıklık'}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditHabitFreq('daily')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${editHabitFreq === 'daily' ? 'bg-blue-500 text-stone-950 font-bold' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.daily') || 'Günlük'}
              </button>
              <button
                type="button"
                onClick={() => setEditHabitFreq('weekly')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${editHabitFreq === 'weekly' ? 'bg-blue-500 text-stone-950 font-bold' : 'glass text-gray-400 hover:text-white'}`}
              >
                {t('goals.weekly') || 'Haftalık'}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => { setIsEditHabitModalOpen(false); setSelectedHabit(null); }}>
              {t('common.cancel') || 'İptal'}
            </Button>
            <Button type="submit" className="bg-blue-500 text-stone-950 font-bold hover:bg-blue-400">Güncelle</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// Simple loader helper
function Loader2({ size = 24, className = '' }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
