-- ==============================================
-- Oturum Açma ve Profil Sistemi Düzeltmeleri
-- ==============================================

-- 1. Profiles (Profiller) Tablosu
-- Kullanıcıların admin onayı ve yetkilerini tutar.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'banned')),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini görebilir
CREATE POLICY "Kullanıcı kendi profilini görebilir" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Trigger: Yeni kayıt olan kullanıcıya otomatik profil açma
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    -- Eğer hiç kullanıcı yoksa, bu ilk kullanıcıdır
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

    INSERT INTO public.profiles (id, status, is_admin)
    VALUES (
        NEW.id,
        CASE WHEN is_first_user THEN 'approved' ELSE 'pending' END,
        CASE WHEN is_first_user THEN true ELSE false END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı bağla (Eğer varsa önce sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Mevcut Kullanıcıları Kurtarma (Zaten kayıt olmuş olanlar için)
-- Daha önceden auth.users tablosuna kayıt olmuş ama profile'ı olmayanları onaylı (approved) admin yapalım.
INSERT INTO public.profiles (id, status, is_admin)
SELECT id, 'approved', true 
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.users.id
);
