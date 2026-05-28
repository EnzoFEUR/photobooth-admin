-- =============================================
-- 🗄️ SUPABASE STORAGE RLS POLICIES
-- Run this in Supabase SQL Editor AFTER creating 
-- a storage bucket called "frames" in the dashboard.
-- =============================================

-- Allow franchisees to upload into their own folder
CREATE POLICY "Franchisees can upload their own frames"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'frames' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow franchisees to read their own frames
CREATE POLICY "Franchisees can read their own frames"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'frames' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow franchisees to delete their own frames
CREATE POLICY "Franchisees can delete their own frames"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'frames' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Super admins can do everything in the frames bucket
CREATE POLICY "Super admins full access to frames bucket"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'frames' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
