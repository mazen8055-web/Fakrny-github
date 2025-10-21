/*
  # Storage Policies for Prescriptions Bucket

  ## Overview
  Set up Row Level Security policies for the prescriptions storage bucket
  to allow users to upload and access their own prescription images.

  ## Security
  - Users can only upload files to their own folder (user_id/)
  - Users can only read files from their own folder
  - Files are publicly accessible via URL but organized by user
*/

CREATE POLICY "Users can upload own prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own prescriptions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own prescriptions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
