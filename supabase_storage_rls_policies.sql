-- تمكين RLS على bucket 'avatars' إذا لم يكن مفعلاً
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. سياسة للسماح للمستخدمين الموثقين بقراءة جميع الصور في bucket 'avatars'
CREATE POLICY "Allow authenticated users to read avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- 2. سياسة للسماح للمستخدمين الموثقين برفع صورهم الخاصة إلى مجلداتهم الشخصية
CREATE POLICY "Allow authenticated users to upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. سياسة للسماح للمستخدمين الموثقين بتحديث صورهم الخاصة في مجلداتهم الشخصية
CREATE POLICY "Allow authenticated users to update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. سياسة للسماح للمستخدمين الموثقين بحذف صورهم الخاصة من مجلداتهم الشخصية
CREATE POLICY "Allow authenticated users to delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);