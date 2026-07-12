-- Harita Modülü: map_pins tablosu
CREATE TABLE IF NOT EXISTS map_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL DEFAULT 'Yeni Konum',
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'planned',
  color TEXT NOT NULL DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pins" ON map_pins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pins" ON map_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON map_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON map_pins FOR DELETE USING (auth.uid() = user_id);
