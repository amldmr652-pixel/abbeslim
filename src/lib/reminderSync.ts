import { createClient } from '@/utils/supabase/client'
import { useReminderStore } from '@/stores/useReminderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { CalendarEvent } from '@/stores/useCalendarStore'
import { Task } from '@/stores/useTaskStore'
import { Habit } from '@/stores/useHabitStore'

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export async function deleteLinkedReminder(sourceType: string, sourceId: string): Promise<void> {
  try {
    const supabase = getSupabase()
    await supabase
      .from('reminders')
      .delete()
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)

    // Reminders state'ini yenile
    useReminderStore.getState().fetchReminders()
  } catch (error) {
    console.error(`[reminderSync] deleteLinkedReminder (${sourceType}:${sourceId}) hatası:`, error)
  }
}

export async function syncReminderForCalendarEvent(event: CalendarEvent): Promise<void> {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const defaults = useSettingsStore.getState().reminderDefaults?.calendar || { daysBefore: [3, 2, 1, 0], enabled: true }

    // Eğer hatırlatıcılar kapalıysa mevcutları temizle ve çık
    if (!defaults.enabled) {
      await deleteLinkedReminder('calendar', event.id)
      return
    }

    // Temiz başlangıç için eski bağlı hatırlatıcıları sil
    await supabase
      .from('reminders')
      .delete()
      .eq('source_type', 'calendar')
      .eq('source_id', event.id)

    const startDate = new Date(event.start_time)

    // Her gün önceliği için ayrı hatırlatıcı ekle
    for (const daysBefore of defaults.daysBefore) {
      const reminderDate = new Date(startDate.getTime() - daysBefore * 24 * 60 * 60 * 1000)
      if (daysBefore === 0) {
        // Etkinlik günü 15 dk önce
        reminderDate.setMinutes(reminderDate.getMinutes() - 15)
      } else {
        // Öncesindeki günlerde sabah 09:00
        reminderDate.setHours(9, 0, 0, 0)
      }

      const hours = String(reminderDate.getHours()).padStart(2, '0')
      const minutes = String(reminderDate.getMinutes()).padStart(2, '0')
      const reminderTime = `${hours}:${minutes}`
      const dayOfWeek = reminderDate.getDay()

      let label = `${daysBefore} gün kaldı`
      if (daysBefore === 0) label = 'Bugün 15 dk önce'
      else if (daysBefore === 1) label = 'Yarın'

      const reminderPayload = {
        user_id: user.id,
        title: `📅 ${event.title} (${label})`,
        description: event.description || `Takvim Hatırlatıcısı (${label})`,
        reminder_time: reminderTime,
        is_recurring: false,
        is_active: true,
        days_of_week: [dayOfWeek],
        source_type: 'calendar',
        source_id: event.id
      }

      await supabase.from('reminders').insert(reminderPayload)
    }

    useReminderStore.getState().fetchReminders()
  } catch (error) {
    console.error('[reminderSync] syncReminderForCalendarEvent hatası:', error)
  }
}

export async function syncReminderForTask(task: Task): Promise<void> {
  try {
    // Görev tamamlandıysa veya son tarihi yoksa bağlı hatırlatıcıları sil
    if (task.is_completed || !task.due_date) {
      await deleteLinkedReminder('task', task.id)
      return
    }

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const defaults = useSettingsStore.getState().reminderDefaults?.task || { daysBefore: [3, 2, 1, 0], enabled: true }

    if (!defaults.enabled) {
      await deleteLinkedReminder('task', task.id)
      return
    }

    // Temizleme
    await supabase
      .from('reminders')
      .delete()
      .eq('source_type', 'task')
      .eq('source_id', task.id)

    const dueDate = new Date(`${task.due_date}T09:00:00`)

    for (const daysBefore of defaults.daysBefore) {
      const reminderDate = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000)
      const dayOfWeek = reminderDate.getDay()

      let label = `${daysBefore} gün kaldı`
      if (daysBefore === 0) label = 'Bugün (Bitiş günü)'
      else if (daysBefore === 1) label = 'Yarın'

      const reminderPayload = {
        user_id: user.id,
        title: `✅ ${task.title} (${label})`,
        description: `Görev Hatırlatıcısı (${label})`,
        reminder_time: '09:00',
        is_recurring: false,
        is_active: true,
        days_of_week: [dayOfWeek],
        source_type: 'task',
        source_id: task.id
      }

      await supabase.from('reminders').insert(reminderPayload)
    }

    useReminderStore.getState().fetchReminders()
  } catch (error) {
    console.error('[reminderSync] syncReminderForTask hatası:', error)
  }
}

export async function syncReminderForHabit(habit: Habit): Promise<void> {
  try {
    const defaults = useSettingsStore.getState().reminderDefaults?.habit || { enabled: true }

    if (!defaults.enabled || !habit.scheduled_time) {
      await deleteLinkedReminder('habit', habit.id)
      return
    }

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // HH:MM formatına getir
    const timeParts = habit.scheduled_time.split(':')
    const reminderTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`

    const daysOfWeek = habit.frequency === 'daily'
      ? [0, 1, 2, 3, 4, 5, 6]
      : [new Date().getDay()]

    const { data: existing } = await supabase
      .from('reminders')
      .select('id')
      .eq('source_type', 'habit')
      .eq('source_id', habit.id)
      .maybeSingle()

    const reminderPayload = {
      user_id: user.id,
      title: `🔁 ${habit.title}`,
      description: habit.description || 'Alışkanlık & Günlük Rutin Hatırlatıcısı',
      reminder_time: reminderTime,
      is_recurring: true,
      is_active: true,
      days_of_week: daysOfWeek,
      source_type: 'habit',
      source_id: habit.id
    }

    if (existing) {
      await supabase
        .from('reminders')
        .update(reminderPayload)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('reminders')
        .insert(reminderPayload)
    }

    useReminderStore.getState().fetchReminders()
  } catch (error) {
    console.error('[reminderSync] syncReminderForHabit hatası:', error)
  }
}
