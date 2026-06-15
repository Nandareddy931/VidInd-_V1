-- ============================================================
-- VIDIND UPLOAD FIX — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xlabsrfujunffdnhkzpn/sql/new
-- ============================================================

-- 1. CREATE STORAGE BUCKETS (safe - skips if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 2. STORAGE POLICIES (drop-and-recreate pattern)

-- Videos bucket policies
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos files" ON storage.objects;

CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own videos files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Thumbnails bucket policies
DROP POLICY IF EXISTS "Thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

CREATE POLICY "Thumbnails are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload their own thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 3. VIDEOS TABLE — Add columns and fix RLS
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Ensure RLS is enabled
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop all old policies and re-create cleanly
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;
DROP POLICY IF EXISTS "Public can read public videos" ON public.videos;

CREATE POLICY "Public can read public videos" ON public.videos
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON public.videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 4. PROFILES — ensure RLS is correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);


-- DONE! Your upload system is now configured.
-- The videos and thumbnails storage buckets are ready.
