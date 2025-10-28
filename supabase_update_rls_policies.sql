-- تحديث سياسات RLS لجدول public.rides

-- سياسات المسؤولين (Admins)
CREATE POLICY "Admins can delete any ride" ON public.rides FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can insert rides" ON public.rides FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Admins can update any ride" ON public.rides FOR UPDATE TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can view all rides" ON public.rides FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

-- سياسات السائقين (Drivers)
CREATE POLICY "Drivers can accept pending rides" ON public.rides FOR UPDATE TO authenticated USING (public.get_user_role() = 'driver' AND status = 'pending' AND driver_id IS NULL);
CREATE POLICY "Drivers can complete accepted rides" ON public.rides FOR UPDATE TO authenticated USING (public.get_user_role() = 'driver' AND driver_id = auth.uid() AND status = 'accepted');
CREATE POLICY "Drivers can view relevant rides" ON public.rides FOR SELECT TO authenticated USING (public.get_user_role() = 'driver' AND driver_id = auth.uid());

-- سياسات الركاب (Passengers)
CREATE POLICY "Passengers can insert rides" ON public.rides FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'passenger' AND passenger_id = auth.uid());
CREATE POLICY "Passengers can update their pending rides" ON public.rides FOR UPDATE TO authenticated USING (public.get_user_role() = 'passenger' AND passenger_id = auth.uid() AND status = 'pending');
CREATE POLICY "Passengers can view their own rides" ON public.rides FOR SELECT TO authenticated USING (public.get_user_role() = 'passenger' AND passenger_id = auth.uid());

-- تحديث سياسات RLS لجدول public.ratings

-- سياسات المسؤولين (Admins)
CREATE POLICY "Admins can delete any rating" ON public.ratings FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

-- سياسات المستخدمين المصادق عليهم (Authenticated Users)
CREATE POLICY "Allow all authenticated users to read ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to create ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());
CREATE POLICY "Allow authenticated users to update their own ratings" ON public.ratings FOR UPDATE TO authenticated USING (rater_id = auth.uid());