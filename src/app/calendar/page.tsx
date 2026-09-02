'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Card, Button, Input, Modal } from '@/app/components/ui';
import { useCalendarStore, CalendarEvent } from '@/stores/useCalendarStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type ViewMode = 'month' | 'week';

const EVENT_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#f97316'];

export default function CalendarPage() {
  const { t, language } = useTranslation();
  const settings = useSettingsStore();
  const { events, isLoading, fetchEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const supabase = createClient();

  // Settings sync on mount
  useEffect(() => {
    if (settings.calendarDefaultView) {
      setViewMode(settings.calendarDefaultView);
    }
  }, [settings.calendarDefaultView]);

  // Yeni etkinlik modalı
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventColor, setNewEventColor] = useState('#22c55e');

  // Düzenleme modalı
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editColor, setEditColor] = useState('#22c55e');

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const data = res?.data;
      setUser(data?.user || null);
      if (data?.user) {
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
      description: newEventDesc.trim() || null,
      start_time: startDateTime,
      end_time: endDateTime,
      is_all_day: !newEventTime,
      color: newEventColor,
    });

    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventColor('#22c55e');
    setIsAddModalOpen(false);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditTitle(event.title);
    setEditDesc(event.description || '');
    setEditColor(event.color || '#22c55e');
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
      description: editDesc.trim() || null,
      start_time: startDateTime,
      end_time: endDateTime,
      is_all_day: !editTime,
      color: editColor,
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

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysOfCurrentWeek = (date: Date, firstDayOfWeek: number) => {
    const current = new Date(date);
    const day = current.getDay();
    // Monday or Sunday offset calculation
    const diff = current.getDate() - day + (firstDayOfWeek === 0 ? 0 : (day === 0 ? -6 : 1));
    const startOfWeek = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Start offset (Monday vs Sunday setting)
  const offset = settings.calendarFirstDayOfWeek === 1
    ? (firstDay === 0 ? 6 : firstDay - 1)
    : firstDay;

  const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR';
  
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i))
  );

  // Generate weekday headers respecting setting
  const dayNames = Array.from({ length: 7 }, (_, i) => {
    // 0 = Sunday, 1 = Monday
    const index = settings.calendarFirstDayOfWeek === 1 ? i + 1 : i;
    // Jan 7, 2024 is Sunday. So Jan 7 + index gives correct order
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + index));
  });

  const weekDays = getDaysOfCurrentWeek(currentDate, settings.calendarFirstDayOfWeek);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <CalendarIcon className="text-green-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white">{t('sidebar.calendar')}</h1>
            <p className="text-gray-400">{t('calendar.subtitle') || 'Kişisel takviminiz ve planlarınız'}</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Today Button */}
          <Button onClick={goToToday} variant="secondary" className="px-4 py-2 text-xs border border-green-500/20 text-green-400 hover:bg-green-500/10">
            {t('calendar.today') || 'Bugün'}
          </Button>

          {/* View Toggle */}
          <div className="flex border border-white/10 rounded-full p-1 bg-black/30">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'month' ? 'bg-green-500 text-stone-950 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('calendar.monthView') || 'Ay'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'week' ? 'bg-green-500 text-stone-950 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('calendar.weekView') || 'Hafta'}
            </button>
          </div>

          <div className="flex items-center glass rounded-full p-1">
            <button onClick={prevPeriod} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-white font-medium min-w-[140px] text-center text-sm">
              {viewMode === 'month' ? (
                `${monthNames[currentMonth]} ${currentYear}`
              ) : (
                `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${monthNames[weekDays[6].getMonth()]}`
              )}
            </span>
            <button onClick={nextPeriod} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <ChevronRight size={20} />
            </button>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} /> {t('calendar.newEvent')}
          </Button>
        </div>
      </div>

      {/* Calendar Area */}
      <Card padding="lg" className="overflow-x-auto border border-green-900/10">
        <div className="min-w-[700px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-bold uppercase tracking-wider text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Monthly View */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-2">
              {/* Offset empty days */}
              {Array.from({ length: offset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-28 rounded-xl bg-white/[0.01] border border-white/5 opacity-30"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
                
                const dayTasks = settings.calendarShowTasks 
                  ? tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr))
                  : [];

                const isToday = 
                  day === new Date().getDate() && 
                  currentMonth === new Date().getMonth() && 
                  currentYear === new Date().getFullYear();

                return renderCalendarDay(day, dateStr, dayEvents, dayTasks, isToday, 'h-28');
              })}
            </div>
          )}

          {/* Calendar Grid - Weekly View */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((dateObj, idx) => {
                const day = dateObj.getDate();
                const m = dateObj.getMonth();
                const y = dateObj.getFullYear();
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
                
                const dayTasks = settings.calendarShowTasks 
                  ? tasks.filter(task => task.due_date && task.due_date.startsWith(dateStr))
                  : [];

                const isToday = 
                  day === new Date().getDate() && 
                  m === new Date().getMonth() && 
                  y === new Date().getFullYear();

                return renderCalendarDay(day, dateStr, dayEvents, dayTasks, isToday, 'h-96');
              })}
            </div>
          )}
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
          <Input
            label={t('calendar.description') || 'Açıklama (Opsiyonel)'}
            placeholder="Etkinlik açıklaması..."
            value={newEventDesc}
            onChange={setNewEventDesc}
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

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">{t('calendar.color') || 'Renk Seçimi'}</label>
            <div className="flex gap-2.5">
              {EVENT_COLORS.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setNewEventColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    newEventColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
          <Input
            label={t('calendar.description') || 'Açıklama (Opsiyonel)'}
            placeholder="Etkinlik açıklaması..."
            value={editDesc}
            onChange={setEditDesc}
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

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">{t('calendar.color') || 'Renk Seçimi'}</label>
            <div className="flex gap-2.5">
              {EVENT_COLORS.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setEditColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    editColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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

  function renderCalendarDay(
    day: number,
    dateStr: string,
    dayEvents: CalendarEvent[],
    dayTasks: any[],
    isToday: boolean,
    heightClass: string
  ) {
    return (
      <div 
        key={dateStr} 
        className={`rounded-xl p-2 border transition-all hover:border-green-500/50 flex flex-col ${heightClass} ${
          isToday ? 'bg-green-950/15 border-green-500/80 shadow-[inset_0_0_15px_rgba(34,197,94,0.15)]' : 'bg-stone-900/40 border-green-900/20'
        }`}
      >
        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
          isToday ? 'bg-green-500 text-stone-950 shadow-sm shadow-green-500/40' : 'text-gray-400'
        }`}>
          {day}
        </span>
        
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
          {/* Events */}
          {dayEvents.map(event => {
            const timeStr = event.is_all_day ? '' : new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            return (
              <button 
                key={event.id} 
                type="button"
                onClick={() => openEditModal(event)}
                className="w-full text-left text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer block font-semibold hover:brightness-110 active:scale-[0.98]"
                style={{
                  backgroundColor: event.color ? `${event.color}15` : '#22c55e15',
                  borderColor: event.color ? `${event.color}40` : '#22c55e40',
                  color: event.color || '#22c55e'
                }}
                title={event.description || undefined}
              >
                {timeStr && <span className="font-mono mr-1 opacity-70 font-normal">{timeStr}</span>}
                {event.title}
              </button>
            )
          })}
          
          {/* Tasks */}
          {dayTasks.map(task => (
            <div 
              key={`task-${task.id}`} 
              className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 font-medium ${
                task.is_completed 
                  ? 'bg-stone-900/20 text-gray-500 line-through border-stone-800' 
                  : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
              }`}
            >
              <CheckCircle2 size={10} className="shrink-0" />
              <span className="truncate">{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
