-- 1. Son Açılan Dosyalar mantığı için 'last_opened_at' sütunu ekleyelim
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Var olan dosyalar için last_opened_at değerini oluşturulma tarihiyle (createdAt) eşitleyelim
UPDATE public.files SET last_opened_at = "createdAt" WHERE last_opened_at IS NULL;
