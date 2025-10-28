-- 1. حذف جميع سياسات RLS الموجودة على جميع الجداول (بشكل صريح أولاً)
-- سياسات public.profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
-- سياسات public.rides
DROP POLICY IF EXISTS "Allow passengers to create rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to view their rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to cancel their rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to view pending rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to view accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to update their accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can update any ride" ON public.rides;
DROP POLICY IF EXISTS "Admins can delete any ride" ON public.rides;
-- سياسات public.ratings
DROP POLICY IF EXISTS "Allow users to insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow users to update their ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow all authenticated users to read ratings" ON public.ratings;
DROP POLICY IF EXISTS "Admins can delete any rating" ON public.ratings;

-- 2. حذف الدوال والـ triggers الموجودة (الآن يمكن حذف get_user_role بدون مشاكل)
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE; -- استخدام CASCADE هنا آمن بعد حذف السياسات
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. إعادة تمكين RLS على الجداول (مهم لتطبيق السياسات الجديدة)
-- هذا يضمن أن RLS مفعلة قبل إضافة السياسات الجديدة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 4. إعادة إنشاء دالة handle_new_user والـ Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger')::text,
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. إعادة إنشاء دالة get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT user_type INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 6. إعادة إنشاء سياسات RLS لجدول public.profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

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

-- 7. إعادة إنشاء سياسات RLS لجدول public.rides
CREATE POLICY "Allow passengers to create rides"
ON public.rides FOR INSERT TO authenticated
WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Allow passengers to view their rides"
ON public.rides FOR SELECT TO authenticated
USING (auth.uid() = passenger_id);

CREATE POLICY "Allow passengers to cancel their rides"
ON public.rides FOR UPDATE TO authenticated
USING (auth.uid() = passenger_id)
WITH CHECK (status IN ('pending', 'accepted', 'cancelled'));

CREATE POLICY "Allow drivers to view pending rides"
ON public.rides FOR SELECT TO authenticated
USING (public.get_user_role() = 'driver' AND status = 'pending');

CREATE POLICY "Allow drivers to view accepted rides"
ON public.rides FOR SELECT TO authenticated
USING (public.get_user_role() = 'driver' AND driver_id = auth.uid() AND status IN ('accepted', 'completed'));

CREATE POLICY "Allow drivers to update their accepted rides"
ON public.rides FOR UPDATE TO authenticated
USING (public.get_user_role() = 'driver' AND driver_id = auth.uid())
WITH CHECK (status IN ('accepted', 'completed'));

CREATE POLICY "Admins can view all rides"
ON public.rides FOR SELECT TO authenticated
USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert rides"
ON public.rides FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update any ride"
ON public.rides FOR UPDATE TO authenticated
USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete any ride"
ON public.rides FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');

-- 8. إعادة إنشاء سياسات RLS لجدول public.ratings
CREATE POLICY "Allow users to insert ratings"
ON public.ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Allow users to update their ratings"
ON public.ratings FOR UPDATE TO authenticated
USING (auth.uid() = rater_id);

CREATE POLICY "Allow all authenticated users to read ratings"
ON public.ratings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can delete any rating"
ON public.ratings FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');