-- 1. Ensure the get_user_type function exists and is correctly defined
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  u_type text;
BEGIN
  SELECT user_type INTO u_type FROM public.profiles WHERE id = user_id;
  RETURN u_type;
END;
$$;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_type(uuid) TO authenticated;

-- 2. Drop existing RLS policies for settings to avoid conflicts
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

-- 3. Enable Row Level Security for the settings table if not already enabled
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS policies for settings

-- Policy to allow authenticated users with 'admin' user_type to SELECT settings
CREATE POLICY "Admins can view settings"
ON public.settings FOR SELECT TO authenticated
USING (public.get_user_type(auth.uid()) = 'admin');

-- Policy to allow authenticated users with 'admin' user_type to INSERT settings
CREATE POLICY "Admins can insert settings"
ON public.settings FOR INSERT TO authenticated
WITH CHECK (public.get_user_type(auth.uid()) = 'admin');

-- Policy to allow authenticated users with 'admin' user_type to UPDATE settings
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE TO authenticated
USING (public.get_user_type(auth.uid()) = 'admin')
WITH CHECK (public.get_user_type(auth.uid()) = 'admin');