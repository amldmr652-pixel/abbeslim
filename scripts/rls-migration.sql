-- 1. Tablolara user_id sütunlarını ekle
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Eğer daha önceden eklenmiş veriler varsa, bunları sisteme kayıt olan İLK KULLANICIYA (size) ata.
-- (Bunu yapmazsak eski notlarınız kaybolur!)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE public.categories SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.files SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- 3. Güvenlik kilitlerini (RLS) aktif et
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 4. Categories tablosu için kurallar (Sadece giriş yapan kişi kendi verisini görebilir)
DROP POLICY IF EXISTS "Kullanıcı kendi kategorilerini görebilir" ON public.categories;
CREATE POLICY "Kullanıcı kendi kategorilerini görebilir" ON public.categories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kategori ekleyebilir" ON public.categories;
CREATE POLICY "Kullanıcı kategori ekleyebilir" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi kategorisini güncelleyebilir" ON public.categories;
CREATE POLICY "Kullanıcı kendi kategorisini güncelleyebilir" ON public.categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi kategorisini silebilir" ON public.categories;
CREATE POLICY "Kullanıcı kendi kategorisini silebilir" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- 5. Files tablosu için kurallar
DROP POLICY IF EXISTS "Kullanıcı kendi dosyalarını görebilir" ON public.files;
CREATE POLICY "Kullanıcı kendi dosyalarını görebilir" ON public.files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı dosya ekleyebilir" ON public.files;
CREATE POLICY "Kullanıcı dosya ekleyebilir" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi dosyasını güncelleyebilir" ON public.files;
CREATE POLICY "Kullanıcı kendi dosyasını güncelleyebilir" ON public.files FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi dosyasını silebilir" ON public.files;
CREATE POLICY "Kullanıcı kendi dosyasını silebilir" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- 6. STORAGE (Depolama) Kuralları (Eğer yoksa)
-- Herkes kendi dosyasını yüklesin, ama RLS'yi tam aktif etmeden uploads klasörünü izole edelim.
-- Service Role kullandığımız için yüklemede sorun çıkmaz, ancak indirmede sorun olmaması için:
DROP POLICY IF EXISTS "Herkes okuyabilir" ON storage.objects;
CREATE POLICY "Kullanıcılar okuyabilir" ON storage.objects FOR SELECT USING ( auth.role() = 'authenticated' );
