-- تمكين RLS على جدول public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول public.profiles

-- السماح للمستخدمين المصادق عليهم بقراءة ملفهم الشخصي
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- السماح للمستخدمين المصادق عليهم بإنشاء ملفهم الشخصي (عند التسجيل)
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- السماح للمستخدمين المصادق عليهم بتحديث ملفهم الشخصي
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- سياسات المسؤولين (Admins) على جدول profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert any profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete any profile"
ON public.profiles FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');