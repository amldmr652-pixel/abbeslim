-- Hatırlatıcılar v2: Öncelik, Kategori, Erteleme ve Ses desteği
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS snooze_minutes INTEGER DEFAULT 10;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'daily';
