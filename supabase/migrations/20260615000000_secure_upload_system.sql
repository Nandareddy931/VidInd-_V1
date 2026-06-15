-- 1. Create channels table if not exists
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channels policies
DROP POLICY IF EXISTS "Channels are viewable by everyone" ON public.channels;
DROP POLICY IF EXISTS "Users can create their own channel" ON public.channels;
DROP POLICY IF EXISTS "Users can update their own channel" ON public.channels;
DROP POLICY IF EXISTS "Users can delete their own channel" ON public.channels;

CREATE POLICY "Channels are viewable by everyone" ON public.channels
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own channel" ON public.channels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel" ON public.channels
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel" ON public.channels
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 2. Alter videos table to add new fields
ALTER TABLE public.videos 
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS duration INT,
  ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;


-- 3. Backfill existing videos for creator_id and video_path
UPDATE public.videos 
SET creator_id = COALESCE(creator_id, user_id)
WHERE creator_id IS NULL;

UPDATE public.videos 
SET video_path = COALESCE(video_path, substring(video_url from '/videos/([^?]+)'))
WHERE video_path IS NULL;

-- Backup placeholder path for any non-conforming urls
UPDATE public.videos 
SET video_path = 'legacy/' || id 
WHERE video_path IS NULL;

-- Make creator_id and video_path NOT NULL
ALTER TABLE public.videos ALTER COLUMN creator_id SET NOT NULL;
ALTER TABLE public.videos ALTER COLUMN video_path SET NOT NULL;


-- 4. Create trigger to sync legacy columns (user_id and views) with new columns (creator_id and views_count)
CREATE OR REPLACE FUNCTION public.sync_video_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user_id and creator_id
  IF NEW.creator_id IS NOT NULL THEN
    NEW.user_id = NEW.creator_id;
  ELSIF NEW.user_id IS NOT NULL THEN
    NEW.creator_id = NEW.user_id;
  END IF;

  -- Sync views and views_count
  IF TG_OP = 'INSERT' THEN
    IF NEW.views_count != 0 AND NEW.views = 0 THEN
      NEW.views = NEW.views_count;
    ELSIF NEW.views != 0 AND NEW.views_count = 0 THEN
      NEW.views_count = NEW.views;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.views_count != OLD.views_count THEN
      NEW.views = NEW.views_count;
    ELSIF NEW.views != OLD.views THEN
      NEW.views_count = NEW.views;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_video_columns ON public.videos;
CREATE TRIGGER trg_sync_video_columns
  BEFORE INSERT OR UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.sync_video_columns();


-- 5. Reconfigure RLS policies on videos to use creator_id
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;
DROP POLICY IF EXISTS "Public can read public videos" ON public.videos;

CREATE POLICY "Public can read public videos" ON public.videos
  FOR SELECT USING (visibility = 'public' OR auth.uid() = creator_id);

CREATE POLICY "Users can insert their own videos" ON public.videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);
