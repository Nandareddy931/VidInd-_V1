-- Drop existing comments table (and its triggers/policies)
DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;

-- Recreate comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) > 0 AND char_length(comment_text) <= 2000),
  likes_count BIGINT NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_comments_video_id_created_at ON public.comments(video_id, created_at DESC);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Blocked users policies
CREATE POLICY "Users can view their own block list" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block someone" ON public.blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock someone" ON public.blocked_users
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Comments Select Policy (filtering out comments of blocked users)
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (
    -- Normal comment: not hidden, and poster is not blocked by video owner
    (
      (NOT is_hidden) AND 
      (NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        INNER JOIN public.videos v ON v.user_id = bu.blocker_id
        WHERE v.id = comments.video_id AND bu.blocked_id = comments.user_id
      ))
    ) OR 
    -- Owner of the comment can see it
    (auth.uid() = user_id) OR
    -- Video creator can see it (to moderate it)
    (auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id))
  );

CREATE POLICY "Users can insert their own comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments can be updated by owner or video creator" ON public.comments
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id))
  );

CREATE POLICY "Comments can be deleted by owner or video creator" ON public.comments
  FOR DELETE TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id))
  );

-- Trigger to update updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers for comment count on videos (re-attached since comments was dropped)
CREATE TRIGGER trg_bump_video_comments_ins
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.bump_video_comments();

CREATE TRIGGER trg_bump_video_comments_del
AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.bump_video_comments();


-- Comment likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes(user_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function to update likes_count on comments
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_comment_likes_count_ins
AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER trg_update_comment_likes_count_del
AFTER DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION public.update_comment_likes_count() FROM PUBLIC, anon, authenticated;
