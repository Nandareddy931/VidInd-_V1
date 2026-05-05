
-- =========================================================
-- 1. STORAGE: videos bucket — remove duplicate {public} write policies
-- =========================================================
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos files" ON storage.objects;

-- =========================================================
-- 2. STORAGE: thumbnails / avatars / banners — restrict writes to authenticated only
-- =========================================================
-- Drop existing {public}-role write policies
DROP POLICY IF EXISTS "Thumbnails owner insert" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails owner update" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Banners owner insert" ON storage.objects;
DROP POLICY IF EXISTS "Banners owner update" ON storage.objects;
DROP POLICY IF EXISTS "Banners owner delete" ON storage.objects;

-- Recreate as authenticated-only
CREATE POLICY "Thumbnails owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Thumbnails owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'thumbnails' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Thumbnails owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'thumbnails' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Banners owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Banners owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Banners owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- =========================================================
-- 3. STORAGE: prevent listing of public buckets — keep direct-URL access
-- Replace broad SELECT policies on public buckets with owner-only listing.
-- Files remain accessible via their public URL because public bucket URLs
-- bypass RLS for read; only listing via the API is restricted.
-- =========================================================
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Banners public read" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails public read" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails are publicly accessible" ON storage.objects;

CREATE POLICY "Avatars owner can list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Banners owner can list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Thumbnails owner can list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'thumbnails' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- =========================================================
-- 4. video_views — restrict INSERT so user_id cannot be spoofed
-- =========================================================
DROP POLICY IF EXISTS "Anyone can insert a view" ON public.video_views;

CREATE POLICY "Anon can insert anonymous view"
  ON public.video_views FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can insert own view"
  ON public.video_views FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- =========================================================
-- 5. subscriptions — hide relationship graph
-- =========================================================
DROP POLICY IF EXISTS "Subscriptions are viewable by everyone" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

-- =========================================================
-- 6. SECURITY DEFINER functions — revoke direct execute from API roles
-- These are only invoked via triggers / auth hooks; clients should not call them.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.bump_video_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_creator_subscribers() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_video_views() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_video_comments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
