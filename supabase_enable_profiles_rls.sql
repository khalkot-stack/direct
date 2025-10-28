-- تمكين RLS على جدول public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول public.profiles

-- السماح للمستخدمين المصادق عليهم بقراءة ملفهم الشخصي أو إذا كانوا مسؤولين
CREATE POLICY "Allow authenticated users to read their own profile or if admin"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.get_user_role() = 'admin');

-- السماح للمستخدمين المصادق عليهم بإنشاء ملفهم الشخصي (عند التسجيل) أو إذا كانوا مسؤولين
CREATE POLICY "Allow authenticated users to insert their own profile or if admin"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.get_user_role() = 'admin');

-- السماح للمستخدمين المصادق عليهم بتحديث ملفهم الشخصي أو إذا كانوا مسؤولين
CREATE POLICY "Allow authenticated users to update their own profile or if admin"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.get_user_role() = 'admin');

-- السماح للمسؤولين بحذف أي ملف شخصي
CREATE POLICY "Admins can delete any profile"
ON public.profiles FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');