-- Enable Row Level Security for the settings table if not already enabled
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users with 'admin' user_type to SELECT settings
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
CREATE POLICY "Admins can view settings"
ON public.settings FOR SELECT TO authenticated
USING (public.get_user_type(auth.uid()) = 'admin');

-- Policy to allow authenticated users with 'admin' user_type to INSERT settings
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
CREATE POLICY "Admins can insert settings"
ON public.settings FOR INSERT TO authenticated
WITH CHECK (public.get_user_type(auth.uid()) = 'admin');

-- Policy to allow authenticated users with 'admin' user_type to UPDATE settings
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE TO authenticated
USING (public.get_user_type(auth.uid()) = 'admin')
WITH CHECK (public.get_user_type(auth.uid()) = 'admin');