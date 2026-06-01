-- ================================================================
-- WatchHub — Media storage bucket
-- Run in Supabase SQL Editor. Idempotent — safe to re-run.
-- Creates the `media` bucket the admin app uploads product/brand
-- images to, plus the RLS policies that allow:
--   • anyone to READ (so customers can see the images)
--   • authenticated users to UPLOAD (the admin Flutter app holds
--     the signed-in user's JWT and writes here directly)
--   • the uploader to UPDATE / DELETE their own objects
--     (admin replace / remove)
-- ================================================================

-- 1. Create the bucket (public read).
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Policies on storage.objects. Drop-then-create so re-running this
--    file always lands in a known state.

DROP POLICY IF EXISTS "media public read"            ON storage.objects;
DROP POLICY IF EXISTS "media authenticated upload"   ON storage.objects;
DROP POLICY IF EXISTS "media owner update"           ON storage.objects;
DROP POLICY IF EXISTS "media owner delete"           ON storage.objects;

CREATE POLICY "media public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media authenticated upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "media owner update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "media owner delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid() = owner);
