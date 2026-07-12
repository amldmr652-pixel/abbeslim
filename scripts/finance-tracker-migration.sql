-- Finans: transactions tablosu
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Medya Takibi: media_tracker tablosu
CREATE TABLE IF NOT EXISTS media_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'book')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  poster_url TEXT DEFAULT NULL,
  tmdb_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE media_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media" ON media_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media" ON media_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media" ON media_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON media_tracker FOR DELETE USING (auth.uid() = user_id);

-- ⚠️ SUPABASE DASHBOARD'DAN ELLE YAPILMASI GEREKENLER:
-- 1. Storage → "audio_notes" adlı PUBLIC bucket oluştur (sesli not kayıtları için)
-- 2. Storage → "avatars" adlı PUBLIC bucket oluştur (profil fotoğrafı için)
