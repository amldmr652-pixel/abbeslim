-- Phase 9 Migration: Hatırlatıcı Otomatik Senkronizasyon Desteği

-- Reminders tablosuna kaynak takibi sütunlarını ekle
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT NULL,  -- 'calendar' | 'task' | 'habit' | NULL
  ADD COLUMN IF NOT EXISTS source_id UUID DEFAULT NULL;    -- Kaynak nesnenin ID'si

-- Hızlı arama için index oluştur
CREATE INDEX IF NOT EXISTS idx_reminders_source ON public.reminders (source_type, source_id);
