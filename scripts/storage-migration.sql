-- 1. Buckets oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_notes', 'audio_notes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Avatars RLS Politikaları
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
CREATE POLICY "Allow public read access to avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow users to upload own avatar" ON storage.objects;
CREATE POLICY "Allow users to upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
CREATE POLICY "Allow users to update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;
CREATE POLICY "Allow users to delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Audio Notes RLS Politikaları
DROP POLICY IF EXISTS "Allow users to read own audio notes" ON storage.objects;
CREATE POLICY "Allow users to read own audio notes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio_notes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to upload own audio notes" ON storage.objects;
CREATE POLICY "Allow users to upload own audio notes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio_notes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to delete own audio notes" ON storage.objects;
CREATE POLICY "Allow users to delete own audio notes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio_notes' AND (storage.foldername(name))[1] = auth.uid()::text);
