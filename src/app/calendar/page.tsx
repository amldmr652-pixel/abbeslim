'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input, Modal } from '@/app/components/ui';
import { useCalendarStore, CalendarEvent } from '@/stores/useCalendarStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, Clock, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function CalendarPage() {
  const { t, language } = useTranslation();
  const { events, isLoading, fetchEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Yeni etkinlik modalı
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  // Düzenleme modalı
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchEvents();
        fetchTasks();
      }
    });
  }, [fetchEvents, fetchTasks]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !user) return;

    const startDateTime = new Date(`${newEventDate}T${newEventTime || '00:00'}:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

    await addEvent({
      user_id: user.id,
      title: newEventTitle,
      start_time: startDateTime,
      end_time: endDateTime,
      is_all_day: !newEventTime,
      color: '#22c55e',
    });

    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setIsAddModalOpen(false);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditTitle(event.title);
    // Tarih ve saati parse et
    const d = new Date(event.start_time);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(event.is_all_day ? '' : d.toTimeString().slice(0, 5));
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle.trim() || !editDate) return;

    const startDateTime = new Date(`${editDate}T${editTime || '00:00'}:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

    await updateEvent(selectedEvent.id, {
      title: editTitle,
      start_time: startDateTime,
      end_time: endDateTime,
      is_all_day: !editTime,
    });

    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    await deleteEvent(selectedEvent.id);
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Pazartesi'den başlamak için offset
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR';
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i))
  );
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i + 1))
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('common.loginRequired')}</h2>
        <p className="text-gray-400">Takviminizi görmek için lütfen giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <CalendarIcon className="text-green-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white">{t('sidebar.calendar')}</h1>
            <p className="text-gray-400">{t('calendar.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center glass rounded-full p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-white font-medium min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} /> {t('calendar.newEvent')}
          </Button>
        </div>
      </div>

      <Card padding="lg" className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Gün Başlıkları */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day, idx) => (
              <div key={idx} className="text-center text-sm font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Takvim Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Boş Günler */}
            {Array.from({ length: offset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 rounded-xl bg-white/5 border border-white/5 opacity-50"></div>
            ))}

            {/* Gerçek Günler */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // O güne ait etkinlikleri bul
              const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
              
              // O güne ait görevleri bul (due_date eşleşmesi)
              const dayTasks = tasks.filter(task => {
                if (!task.due_date) return false;
                return task.due_date.startsWith(dateStr);
              });

              const isToday = 
                day === new Date().getDate() && 
                currentMonth === new Date().getMonth() && 
                currentYear === new Date().getFullYear();

              return (
                <div 
                  key={day} 
                  className={`h-28 rounded-xl p-2 border transition-colors hover:border-green-500/50 flex flex-col ${
                    isToday ? 'bg-green-900/20 border-green-500' : 'bg-black/30 border-green-900/30'
                  }`}
                >
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-green-500 text-white' : 'text-gray-400'
                  }`}>
                    {day}
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                    {/* Etkinlikler (yeşil) */}
                    {dayEvents.map(event => {
                      const timeStr = event.is_all_day ? '' : new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      return (
                        <button 
                          key={event.id} 
                          onClick={() => openEditModal(event)}
                          className="w-full text-left text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 truncate hover:bg-green-500/30 transition-colors cursor-pointer"
                        >
                          {timeStr && <span className="font-mono mr-1 opacity-70">{timeStr}</span>}
                          {event.title}
                        </button>
                      )
                    })}
                    
                    {/* Görevler (sarı) */}
                    {dayTasks.map(task => (
                      <div 
                        key={`task-${task.id}`} 
                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 ${
                          task.is_completed 
                            ? 'bg-gray-500/20 text-gray-500 line-through' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        <CheckCircle2 size={10} className="shrink-0" />
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Yeni Etkinlik Modalı */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('calendar.newEvent')}
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label={t('calendar.eventName')}
            placeholder="Toplantı, ders vb."
            value={newEventTitle}
            onChange={setNewEventTitle}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label={t('calendar.date')}
              value={newEventDate}
              onChange={setNewEventDate}
              required
            />
            <Input
              type="time"
              label={t('calendar.timeOptional')}
              value={newEventTime}
              onChange={setNewEventTime}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-green-900/30">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!newEventTitle.trim() || !newEventDate || isLoading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Etkinlik Düzenleme Modalı */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
        title="Etkinliği Düzenle"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <Input
            label={t('calendar.eventName')}
            placeholder="Toplantı, ders vb."
            value={editTitle}
            onChange={setEditTitle}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label={t('calendar.date')}
              value={editDate}
              onChange={setEditDate}
              required
            />
            <Input
              type="time"
              label={t('calendar.timeOptional')}
              value={editTime}
              onChange={setEditTime}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-green-900/30">
            <Button 
              variant="danger" 
              type="button" 
              onClick={handleDeleteEvent}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} /> Sil
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!editTitle.trim() || !editDate}>
                Güncelle
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
