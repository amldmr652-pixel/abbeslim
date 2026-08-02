import { createClient } from '@/utils/supabase/client'
import { useReminderStore } from '@/stores/useReminderStore'
import { CalendarEvent } from '@/stores/useCalendarStore'
import { Task } from '@/stores/useTaskStore'
import { Habit } from '@/stores/useHabitStore'

export async function deleteLinkedReminder(sourceType: string, sourceId: string): Promise<void> {
  try {
    const supabase = createClient()
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Etkinlik başlama zamanından 15 dakika öncesini hesapla
    const startDate = new Date(event.start_time)
    const reminderDate = new Date(startDate.getTime() - 15 * 60 * 1000)

    const hours = String(reminderDate.getHours()).padStart(2, '0')
    const minutes = String(reminderDate.getMinutes()).padStart(2, '0')
    const reminderTime = `${hours}:${minutes}`
    const dayOfWeek = startDate.getDay()

    // Mevcut senkronize hatırlatıcı var mı kontrol et
    const { data: existing } = await supabase
      .from('reminders')
      .select('id')
      .eq('source_type', 'calendar')
      .eq('source_id', event.id)
      .maybeSingle()

    const reminderPayload = {
      user_id: user.id,
      title: `📅 ${event.title}`,
      description: event.description || 'Takvim Etkinliği Hatırlatıcısı (15 dk önce)',
      reminder_time: reminderTime,
      is_recurring: false,
      is_active: true,
      days_of_week: [dayOfWeek],
      source_type: 'calendar',
      source_id: event.id
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
    console.error('[reminderSync] syncReminderForCalendarEvent hatası:', error)
  }
}

export async function syncReminderForTask(task: Task): Promise<void> {
  try {
    // Görev tamamlandıysa veya son tarihi yoksa bağlı hatırlatıcıyı sil
    if (task.is_completed || !task.due_date) {
      await deleteLinkedReminder('task', task.id)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Bitiş gününde sabah 09:00 hatırlatıcı
    const taskDate = new Date(`${task.due_date}T00:00:00`)
    const dayOfWeek = taskDate.getDay()

    const { data: existing } = await supabase
      .from('reminders')
      .select('id')
      .eq('source_type', 'task')
      .eq('source_id', task.id)
      .maybeSingle()

    const reminderPayload = {
      user_id: user.id,
      title: `✅ ${task.title}`,
      description: `Görev Bitiş Günü Hatırlatıcısı (${task.due_date})`,
      reminder_time: '09:00',
      is_recurring: false,
      is_active: true,
      days_of_week: [dayOfWeek],
      source_type: 'task',
      source_id: task.id
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
    console.error('[reminderSync] syncReminderForTask hatası:', error)
  }
}

export async function syncReminderForHabit(habit: Habit): Promise<void> {
  try {
    // Alışkanlığın planlanmış saati yoksa bağlı hatırlatıcıyı sil
    if (!habit.scheduled_time) {
      await deleteLinkedReminder('habit', habit.id)
      return
    }

    const supabase = createClient()
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
