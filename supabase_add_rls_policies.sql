-- Enable RLS on the profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to view their own profile
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON profiles;
CREATE POLICY "Allow authenticated users to view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy to allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS on the 'avatars' storage bucket if not already enabled
-- This assumes you have a storage bucket named 'avatars'
-- You might need to adjust the bucket name if it's different
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for 'avatars' bucket: Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for 'avatars' bucket: Allow authenticated users to view their own avatars
DROP POLICY IF EXISTS "Allow authenticated users to view their own avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to view their own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for 'avatars' bucket: Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for 'avatars' bucket: Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);