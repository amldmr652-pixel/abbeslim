-- ==============================================
-- Faz 5: Not Sistemi (Life OS)
-- ==============================================

-- 1. Notes (Notlar) Tablosu
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    audio_url TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar sadece kendi notlarını görebilir" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi notlarını oluşturabilir" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi notlarını güncelleyebilir" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar sadece kendi notlarını silebilir" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger: updated_at
CREATE TRIGGER update_notes_modtime
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column(); -- phase4'te tanımlı

-- 2. Storage Bucket: Ses Kayıtları (Audio Notes)
-- Not: Supabase Storage için SQL ile bucket oluşturma
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio_notes', 'audio_notes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Politikaları
CREATE POLICY "Kullanıcılar kendi ses kayıtlarını yükleyebilir" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio_notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Kullanıcılar kendi ses kayıtlarını silebilir" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio_notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Ses kayıtları herkes tarafından (public) dinlenebilir (linki olanlar)" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio_notes');
