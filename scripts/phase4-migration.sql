-- ==============================================
-- Faz 4: Görev & Takvim Sistemi (Life OS)
-- ==============================================

-- 1. Tasks (Görevler) Tablosu
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    is_completed BOOLEAN DEFAULT false,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar sadece kendi görevlerini görebilir" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi görevlerini oluşturabilir" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi görevlerini güncelleyebilir" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi görevlerini silebilir" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Calendar Events (Takvim Etkinlikleri) Tablosu
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    color TEXT DEFAULT '#22c55e', -- Varsayılan yeşil (Tailwind green-500)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar sadece kendi etkinliklerini görebilir" ON public.calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi etkinliklerini oluşturabilir" ON public.calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi etkinliklerini güncelleyebilir" ON public.calendar_events
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi etkinliklerini silebilir" ON public.calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Fonksiyon: updated_at alanını otomatik güncelleyen trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggerlar
CREATE TRIGGER update_tasks_modtime
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_calendar_events_modtime
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
