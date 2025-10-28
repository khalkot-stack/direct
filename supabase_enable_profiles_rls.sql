-- تمكين RLS على جدول public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- إضافة سياسة تسمح للمستخدمين بقراءة ملفاتهم الشخصية فقط
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- إضافة سياسة تسمح للمستخدمين بتحديث ملفاتهم الشخصية فقط
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- إضافة سياسة تسمح بإنشاء ملف شخصي عند التسجيل (يجب أن يتم بواسطة trigger)
-- هذه السياسة تسمح بالINSERT فقط إذا كان الـ ID هو نفسه auth.uid()
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);