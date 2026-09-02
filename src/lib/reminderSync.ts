import { createClient } from '@/utils/supabase/client';
import { CalendarEvent } from '@/stores/useCalendarStore';
import { Task } from '@/stores/useTaskStore';
import { Habit } from '@/stores/useHabitStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

// Lazy singleton supabase client
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

/**
 * Belirli bir kaynağa (calendar, task, habit) ait ilişkili hatırlatıcıları siler.
 */
export async function deleteLinkedReminder(
  sourceType: 'calendar' | 'task' | 'habit',
  sourceId: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('reminders')
      .delete()
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);

    if (error) {
      console.warn(`[reminderSync] deleteLinkedReminder error (${sourceType}, ${sourceId}):`, error.message);
    }
  } catch (err: any) {
    console.warn(`[reminderSync] deleteLinkedReminder exception:`, err?.message || err);
  }
}

/**
 * Takvim etkinliği için otomatik hatırlatıcı(lar) oluşturur veya senkronize eder.
 */
export async function syncReminderForCalendar(event: CalendarEvent): Promise<void> {
  try {
    if (!event || !event.id || !event.user_id || !event.start_time) return;

    // Önce mevcut ilişkili hatırlatıcıları temizle
    await deleteLinkedReminder('calendar', event.id);

    const settings = useSettingsStore.getState().reminderDefaults?.calendar;
    if (settings && !settings.enabled) return;

    const daysBefore = settings?.daysBefore || [3, 2, 1, 0];
    const eventStartDate = new Date(event.start_time);
    if (isNaN(eventStartDate.getTime())) return;

    const eventTimeStr = event.start_time.includes('T')
      ? event.start_time.split('T')[1].slice(0, 5)
      : '09:00';

    // 15 dakika öncesi hesaplaması
    const fifteenMinBefore = new Date(eventStartDate.getTime() - 15 * 60 * 1000);
    const fifteenMinTimeStr = `${String(fifteenMinBefore.getHours()).padStart(2, '0')}:${String(fifteenMinBefore.getMinutes()).padStart(2, '0')}`;

    const remindersToInsert: any[] = [];

    // 1. Etkinlik günü 15 dk önce tek seferlik hatırlatıcı
    if (daysBefore.includes(0)) {
      remindersToInsert.push({
        user_id: event.user_id,
        title: `📅 ${event.title}`,
        description: event.description || `Takvim Etkinliği: ${eventTimeStr}`,
        reminder_time: fifteenMinTimeStr,
        days_of_week: [eventStartDate.getDay()],
        is_recurring: false,
        is_active: true,
        priority: 'medium',
        category: 'work',
        sound: 'beep',
        snooze_minutes: 10,
        repeat_type: 'once',
        source_type: 'calendar',
        source_id: event.id,
      });
    }

    // 2. Gün öncesi hatırlatıcıları (örn. 1 gün önce, 3 gün önce saat 09:00'da)
    for (const d of daysBefore) {
      if (d === 0) continue;
      const priorDate = new Date(eventStartDate);
      priorDate.setDate(priorDate.getDate() - d);

      const label = d === 1 ? 'yarın' : `${d} gün kaldı`;
      remindersToInsert.push({
        user_id: event.user_id,
        title: `📅 ${event.title} (${label})`,
        description: `Takvim etkinliği yaklaşıyor: ${event.title} (${eventStartDate.toLocaleDateString('tr-TR')} ${eventTimeStr})`,
        reminder_time: '09:00',
        days_of_week: [priorDate.getDay()],
        is_recurring: false,
        is_active: true,
        priority: 'medium',
        category: 'work',
        sound: 'chime',
        snooze_minutes: 10,
        repeat_type: 'once',
        source_type: 'calendar',
        source_id: event.id,
      });
    }

    if (remindersToInsert.length > 0) {
      const { error } = await getSupabase().from('reminders').insert(remindersToInsert);
      if (error) {
        console.warn('[reminderSync] syncReminderForCalendar insert error:', error.message);
      }
    }
  } catch (err: any) {
    console.warn('[reminderSync] syncReminderForCalendar exception:', err?.message || err);
  }
}

/**
 * Görev için bitiş tarihine göre otomatik hatırlatıcı oluşturur veya siler.
 */
export async function syncReminderForTask(task: Task): Promise<void> {
  try {
    if (!task || !task.id || !task.user_id) return;

    // Önceki ilişkili hatırlatıcıları temizle
    await deleteLinkedReminder('task', task.id);

    // Görev tamamlanmışsa veya bitiş tarihi yoksa yeni hatırlatıcı ekleme
    if (task.is_completed || !task.due_date) return;

    const settings = useSettingsStore.getState().reminderDefaults?.task;
    if (settings && !settings.enabled) return;

    const daysBefore = settings?.daysBefore || [3, 2, 1, 0];
    const dueDate = new Date(task.due_date);
    if (isNaN(dueDate.getTime())) return;

    const remindersToInsert: any[] = [];

    // Görev bitiş günü sabah 09:00 hatırlatıcısı
    if (daysBefore.includes(0)) {
      remindersToInsert.push({
        user_id: task.user_id,
        title: `✅ ${task.title}`,
        description: task.description || 'Bugün teslim edilecek görev!',
        reminder_time: '09:00',
        days_of_week: [dueDate.getDay()],
        is_recurring: false,
        is_active: true,
        priority: task.priority || 'medium',
        category: 'work',
        sound: 'beep',
        snooze_minutes: 10,
        repeat_type: 'once',
        source_type: 'task',
        source_id: task.id,
      });
    }

    // Önceden hatırlatmalar (1 gün önce, 3 gün önce)
    for (const d of daysBefore) {
      if (d === 0) continue;
      const priorDate = new Date(dueDate);
      priorDate.setDate(priorDate.getDate() - d);

      const label = d === 1 ? 'yarın bitiyor' : `${d} gün kaldı`;
      remindersToInsert.push({
        user_id: task.user_id,
        title: `✅ ${task.title} (${label})`,
        description: `Görev son teslim tarihi: ${dueDate.toLocaleDateString('tr-TR')}`,
        reminder_time: '09:00',
        days_of_week: [priorDate.getDay()],
        is_recurring: false,
        is_active: true,
        priority: task.priority || 'medium',
        category: 'work',
        sound: 'chime',
        snooze_minutes: 10,
        repeat_type: 'once',
        source_type: 'task',
        source_id: task.id,
      });
    }

    if (remindersToInsert.length > 0) {
      const { error } = await getSupabase().from('reminders').insert(remindersToInsert);
      if (error) {
        console.warn('[reminderSync] syncReminderForTask insert error:', error.message);
      }
    }
  } catch (err: any) {
    console.warn('[reminderSync] syncReminderForTask exception:', err?.message || err);
  }
}

/**
 * Alışkanlık / Rutin için saatine ve frekansına göre tekrarlayan hatırlatıcı oluşturur.
 */
export async function syncReminderForHabit(habit: Habit): Promise<void> {
  try {
    if (!habit || !habit.id || !habit.user_id) return;

    // Önceki ilişkili hatırlatıcıyı temizle
    await deleteLinkedReminder('habit', habit.id);

    // Belirli bir saat atanmamışsa hatırlatıcı oluşturma
    if (!habit.scheduled_time) return;

    const settings = useSettingsStore.getState().reminderDefaults?.habit;
    if (settings && !settings.enabled) return;

    const daysOfWeek = habit.frequency === 'daily'
      ? [0, 1, 2, 3, 4, 5, 6]
      : [1]; // weekly için varsayılan Pazartesi

    const { error } = await getSupabase()
      .from('reminders')
      .insert([
        {
          user_id: habit.user_id,
          title: `🔁 ${habit.title}`,
          description: habit.description || 'Günlük rutin / alışkanlık zamanı',
          reminder_time: habit.scheduled_time.slice(0, 5),
          days_of_week: daysOfWeek,
          is_recurring: true,
          is_active: true,
          priority: 'medium',
          category: 'personal',
          sound: 'gentle',
          snooze_minutes: 10,
          repeat_type: habit.frequency === 'daily' ? 'daily' : 'weekly',
          source_type: 'habit',
          source_id: habit.id,
        },
      ]);

    if (error) {
      console.warn('[reminderSync] syncReminderForHabit insert error:', error.message);
    }
  } catch (err: any) {
    console.warn('[reminderSync] syncReminderForHabit exception:', err?.message || err);
  }
}
