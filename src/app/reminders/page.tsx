'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, Edit, Clock, AlertCircle } from 'lucide-react';
import { Card, Button, Modal, Input } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useReminderStore, Reminder } from '@/stores/useReminderStore';
import { createClient } from '@/utils/supabase/client';

const DAYS = [
  { label: 'Pzt', value: 1 },
  { label: 'Sal', value: 2 },
  { label: 'Çar', value: 3 },
  { label: 'Per', value: 4 },
  { label: 'Cum', value: 5 },
  { label: 'Cmt', value: 6 },
  { label: 'Paz', value: 0 },
];

export default function RemindersPage() {
  const { t } = useTranslation();
  const { reminders, fetchReminders, addReminder, updateReminder, deleteReminder, toggleActive } = useReminderStore();

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchReminders();
      }
      setLoadingUser(false);
    };
    getUser();
  }, [fetchReminders]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setTitle('');
    setDescription('');
    setReminderTime('08:00');
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: Reminder) => {
    setIsEditMode(true);
    setSelectedId(reminder.id);
    setTitle(reminder.title);
    setDescription(reminder.description || '');
    setReminderTime(reminder.reminder_time.slice(0, 5));
    setSelectedDays(reminder.days_of_week || []);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDayToggle = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    if (selectedDays.length === 0) {
      setErrorMsg('Lütfen en az bir gün seçin.');
      return;
    }

    try {
      if (isEditMode && selectedId) {
        await updateReminder(selectedId, {
          title: title.trim(),
          description: description.trim(),
          reminder_time: reminderTime,
          days_of_week: selectedDays,
        });
      } else {
        await addReminder({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          reminder_time: reminderTime,
          days_of_week: selectedDays,
          is_active: true,
          sound: 'default',
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'İşlem gerçekleştirilirken hata oluştu.');
    }
  };

  const getDaysLabel = (reminderDays: number[]) => {
    if (!reminderDays || reminderDays.length === 0) return 'Seçili gün yok';
    if (reminderDays.length === 7) return 'Her gün';
    
    // İş günleri check
    const isWeekdays = [1, 2, 3, 4, 5].every(d => reminderDays.includes(d)) && reminderDays.length === 5;
    if (isWeekdays) return 'Hafta içi';

    // Hafta sonu check
    const isWeekend = [6, 0].every(d => reminderDays.includes(d)) && reminderDays.length === 2;
    if (isWeekend) return 'Hafta sonu';

    return reminderDays
      .map(d => DAYS.find(day => day.value === d)?.label)
      .filter(Boolean)
      .join(', ');
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-white">
        <div className="animate-spin text-green-500 w-8 h-8 border-4 border-current border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired') || 'Giriş Gerekli'}</h2>
        <p className="text-gray-400">Hatırlatıcılarınızı yönetmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="text-green-500" size={32} />
            {t('sidebar.reminders') || 'Hatırlatıcılar'}
          </h1>
          <p className="text-gray-400 mt-2">Günlük rutinleriniz için alarmlar ve hatırlatıcılar kurun</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2" size="md">
          <Plus size={16} /> Yeni Hatırlatıcı
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reminders.length === 0 ? (
          <div className="text-center text-gray-500 py-16 glass rounded-3xl">
            <BellOff size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-base font-semibold text-gray-400">Henüz hatırlatıcı eklenmedi.</p>
            <p className="text-xs text-gray-500 mt-1">Hemen bir hatırlatıcı ekleyerek başlayın.</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`glass p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                reminder.is_active 
                  ? 'border-green-500/10 hover:border-green-500/20' 
                  : 'border-white/5 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  reminder.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-500'
                }`}>
                  <Clock size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold text-white font-mono">
                      {reminder.reminder_time.slice(0, 5)}
                    </span>
                    <h3 className="font-semibold text-base text-white truncate max-w-xs md:max-w-md">
                      {reminder.title}
                    </h3>
                    {reminder.source_type === 'calendar' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                        📅 Takvim
                      </span>
                    )}
                    {reminder.source_type === 'task' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                        ✅ Görev
                      </span>
                    )}
                    {reminder.source_type === 'habit' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        🔁 Rutin
                      </span>
                    )}
                  </div>
                  {reminder.description && (
                    <p className="text-xs text-gray-400 mt-1">{reminder.description}</p>
                  )}
                  <p className="text-xs text-green-500/70 font-semibold mt-1">
                    {getDaysLabel(reminder.days_of_week)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                {/* Active Toggle Switch */}
                <button
                  onClick={() => toggleActive(reminder.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    reminder.is_active ? 'bg-green-500' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-stone-950 transition-transform ${
                      reminder.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(reminder)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="Düzenle"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bu hatırlatıcıyı silmek istediğinizden emin misiniz?')) {
                        deleteReminder(reminder.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reminder Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? 'Hatırlatıcıyı Düzenle' : 'Yeni Hatırlatıcı'} 
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-red-900/50 text-red-200 border border-red-500/30 rounded-xl p-3 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Başlık</label>
            <Input
              value={title}
              onChange={setTitle}
              placeholder="Örn: Su iç, İlaç al"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Açıklama (Opsiyonel)</label>
            <Input
              value={description}
              onChange={setDescription}
              placeholder="Örn: 2 bardak su içmeyi unutma"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Saat</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white font-mono focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-2 font-semibold">Hangi Günler Tekrarlansın?</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-green-500 text-stone-950 border-green-500'
                        : 'bg-stone-800/50 text-gray-400 border-stone-700/50 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit">
              {isEditMode ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
