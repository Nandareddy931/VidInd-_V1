-- =========================================================
-- Vidind: engagement schema (views events, likes, subscriptions)
-- =========================================================

-- 1) Add subscriber counter to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscribers_count BIGINT NOT NULL DEFAULT 0;

-- 2) Add likes counter to existing videos table (views already exists)
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS likes_count BIGINT NOT NULL DEFAULT 0;

-- =========================================================
-- 3) views (event-based watch tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                         -- nullable for guests
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watch_time INTEGER NOT NULL DEFAULT 0,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON public.video_views(created_at);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. guests) can record a valid view
CREATE POLICY "Anyone can insert a view"
  ON public.video_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only the video owner can read raw view events (analytics)
CREATE POLICY "Video owners can read their video views"
  ON public.video_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_views.video_id AND v.user_id = auth.uid()
    )
  );

-- =========================================================
-- 4) likes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_video_id ON public.likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT TO public USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own like"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- 5) subscriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, creator_id),
  CHECK (subscriber_id <> creator_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON public.subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON public.subscriptions(subscriber_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscriptions are viewable by everyone"
  ON public.subscriptions FOR SELECT TO public USING (true);

CREATE POLICY "Users can subscribe as themselves"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can unsubscribe themselves"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = subscriber_id);

-- =========================================================
-- 6) Counter triggers (atomic, no race conditions)
-- =========================================================

-- Likes counter on videos
CREATE OR REPLACE FUNCTION public.bump_video_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
CREATE TRIGGER trg_likes_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.bump_video_likes();

-- Subscribers counter on profiles
CREATE OR REPLACE FUNCTION public.bump_creator_subscribers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET subscribers_count = subscribers_count + 1
      WHERE user_id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET subscribers_count = GREATEST(subscribers_count - 1, 0)
      WHERE user_id = OLD.creator_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_subs_count ON public.subscriptions;
CREATE TRIGGER trg_subs_count
AFTER INSERT OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.bump_creator_subscribers();

-- Views counter on videos (only valid views ever land in video_views)
CREATE OR REPLACE FUNCTION public.bump_video_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.videos SET views_count = views_count + 1 WHERE id = NEW.video_id;
  -- keep legacy `views` column in sync if present
  UPDATE public.videos SET views = views + 1 WHERE id = NEW.video_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_views_count ON public.video_views;
CREATE TRIGGER trg_views_count
AFTER INSERT ON public.video_views
FOR EACH ROW EXECUTE FUNCTION public.bump_video_views();

-- Add views_count alongside legacy `views` for clean naming going forward
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;

-- Backfill views_count from existing views column
UPDATE public.videos SET views_count = views WHERE views_count = 0 AND views > 0;