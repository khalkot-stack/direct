-- تمكين RLS على جدول public.rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول public.rides

-- السماح للمستخدمين المصادق عليهم بإنشاء رحلات كركاب
CREATE POLICY "Allow passengers to create rides"
ON public.rides FOR INSERT TO authenticated
WITH CHECK (auth.uid() = passenger_id);

-- السماح للركاب بعرض رحلاتهم الخاصة
CREATE POLICY "Allow passengers to view their rides"
ON public.rides FOR SELECT TO authenticated
USING (auth.uid() = passenger_id);

-- السماح للركاب بإلغاء رحلاتهم (إذا كانت معلقة أو مقبولة)
CREATE POLICY "Allow passengers to cancel their rides"
ON public.rides FOR UPDATE TO authenticated
USING (auth.uid() = passenger_id)
WITH CHECK (status IN ('pending', 'accepted', 'cancelled')); -- يمكن للراكب تغيير الحالة إلى 'cancelled' فقط

-- السماح للسائقين بعرض الرحلات المعلقة (للبحث عن ركاب)
CREATE POLICY "Allow drivers to view pending rides"
ON public.rides FOR SELECT TO authenticated
USING (public.get_user_role() = 'driver' AND status = 'pending');

-- السماح للسائقين بعرض رحلاتهم المقبولة والمكتملة
CREATE POLICY "Allow drivers to view accepted rides"
ON public.rides FOR SELECT TO authenticated
USING (public.get_user_role() = 'driver' AND driver_id = auth.uid() AND status IN ('accepted', 'completed'));

-- السماح للسائقين بتحديث رحلاتهم المقبولة (لتغيير الحالة إلى 'completed')
CREATE POLICY "Allow drivers to update their accepted rides"
ON public.rides FOR UPDATE TO authenticated
USING (public.get_user_role() = 'driver' AND driver_id = auth.uid())
WITH CHECK (status IN ('accepted', 'completed')); -- يمكن للسائق تغيير الحالة إلى 'completed' فقط

-- سياسات المسؤولين (Admins) على جدول rides
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


-- تمكين RLS على جدول public.ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول public.ratings

-- السماح للمستخدمين المصادق عليهم بإنشاء تقييمات
CREATE POLICY "Allow users to insert ratings"
ON public.ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = rater_id);

-- السماح للمستخدمين المصادق عليهم بتحديث تقييماتهم الخاصة
CREATE POLICY "Allow users to update their ratings"
ON public.ratings FOR UPDATE TO authenticated
USING (auth.uid() = rater_id);

-- السماح لجميع المستخدمين المصادق عليهم بقراءة التقييمات
CREATE POLICY "Allow all authenticated users to read ratings"
ON public.ratings FOR SELECT TO authenticated
USING (true);

-- سياسات المسؤولين (Admins) على جدول ratings
CREATE POLICY "Admins can delete any rating"
ON public.ratings FOR DELETE TO authenticated
USING (public.get_user_role() = 'admin');