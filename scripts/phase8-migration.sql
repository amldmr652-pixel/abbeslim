-- =============================================
-- Phase 8 Migration: Liked Songs, Habits Update, Reminders
-- Run this script in the Supabase SQL Editor
-- =============================================

-- 1) Habits tablosunun var olduğundan emin ol (phase7 idempotent)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    streak INTEGER DEFAULT 0,
    color TEXT DEFAULT 'bg-blue-500',
    last_completed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (IF NOT EXISTS ile güvenli)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users can view their own habits.') THEN
        CREATE POLICY "Users can view their own habits." ON public.habits FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users can insert their own habits.') THEN
        CREATE POLICY "Users can insert their own habits." ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users can update their own habits.') THEN
        CREATE POLICY "Users can update their own habits." ON public.habits FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Users can delete their own habits.') THEN
        CREATE POLICY "Users can delete their own habits." ON public.habits FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2) Habits tablosuna yeni sütunlar ekle
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3) Liked Songs tablosu
CREATE TABLE IF NOT EXISTS public.liked_songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT DEFAULT '',
    channel_id TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_liked_songs_unique ON public.liked_songs(user_id, video_id);

ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_songs' AND policyname = 'Users can view their liked songs.') THEN
        CREATE POLICY "Users can view their liked songs." ON public.liked_songs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_songs' AND policyname = 'Users can insert liked songs.') THEN
        CREATE POLICY "Users can insert liked songs." ON public.liked_songs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_songs' AND policyname = 'Users can delete liked songs.') THEN
        CREATE POLICY "Users can delete liked songs." ON public.liked_songs FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4) Reminders tablosu
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    reminder_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,0}',
    sound TEXT DEFAULT 'default',
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can view their reminders.') THEN
        CREATE POLICY "Users can view their reminders." ON public.reminders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can insert reminders.') THEN
        CREATE POLICY "Users can insert reminders." ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can update reminders.') THEN
        CREATE POLICY "Users can update reminders." ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can delete reminders.') THEN
        CREATE POLICY "Users can delete reminders." ON public.reminders FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
