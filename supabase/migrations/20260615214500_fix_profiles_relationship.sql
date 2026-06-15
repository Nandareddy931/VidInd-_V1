-- ============================================================
-- VIDIND PROFILE RELATIONSHIP FIX — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xlabsrfujunffdnhkzpn/sql/new
-- ============================================================

-- Safely drop old constraint if it exists
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_profiles_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Fix the profiles relationship by adding the foreign key constraint.
-- Note: In this database structure, public.profiles.id is a surrogate random UUID,
-- and public.profiles.user_id is the unique column storing the authenticated User ID (auth.uid()).
-- Since comments.user_id stores the authenticated User ID, the foreign key must reference
-- profiles.user_id to prevent constraint violations and enable proper PostgREST table joins.
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_profiles_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Reload Supabase PostgREST schema cache to make the relationship immediately available to the API
NOTIFY pgrst, 'reload schema';
