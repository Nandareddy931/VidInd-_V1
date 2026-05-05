-- Make videos bucket private and enforce access via RLS on storage.objects
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Drop any prior policies we might recreate
DROP POLICY IF EXISTS "Public can read public videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can read their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their videos" ON storage.objects;

-- SELECT: anyone can read a video object if the corresponding row is public,
-- or if the requester is the owner (folder = user_id).
CREATE POLICY "Public can read public videos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.video_url LIKE '%/' || storage.objects.name
      AND (v.visibility = 'public' OR v.user_id = auth.uid())
  )
);

-- INSERT/UPDATE/DELETE: owner-scoped by folder name = auth.uid()
CREATE POLICY "Owners can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can update their videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);