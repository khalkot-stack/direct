-- 1. Disable RLS on all affected tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 2. Drop all known RLS policies from profiles table
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow drivers to view passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow passengers to view driver profiles for their accepted rides" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 3. Drop all known RLS policies from rides table
DROP POLICY IF EXISTS "Admins can manage all rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view and update their accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can view and manage their own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view pending rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can accept pending rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can delete their completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can delete their completed/cancelled rides" ON public.rides;

-- 4. Drop all known RLS policies from settings table
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

-- 5. Drop the get_user_type function with CASCADE to remove any dependent objects
-- This is the crucial step to break any hidden dependencies.
DROP FUNCTION IF EXISTS public.get_user_type(uuid) CASCADE;

-- 6. Re-create the get_user_type function
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER -- SECURITY DEFINER is important for RLS functions
AS $function$
DECLARE
  u_type text;
BEGIN
  SELECT user_type INTO u_type FROM public.profiles WHERE id = user_id;
  RETURN u_type;
END;
$function$;

-- 7. Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 8. Re-create essential RLS policies for profiles (DO NOT use get_user_type here)
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated USING (
  (auth.uid() = id)
);

CREATE POLICY "Authenticated users can create their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = id)
);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (
  (auth.uid() = id)
) WITH CHECK (
  (auth.uid() = id)
);

CREATE POLICY "Authenticated users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated USING (
  (auth.uid() = id)
);

-- 9. Re-create RLS policies for rides
-- Admin can manage all rides
CREATE POLICY "Admins can manage all rides"
ON public.rides FOR ALL TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
);

-- Passengers can view and manage their own rides
CREATE POLICY "Passengers can view and manage their own rides"
ON public.rides FOR ALL TO authenticated USING (
  (auth.uid() = passenger_id)
) WITH CHECK (
  (auth.uid() = passenger_id)
);

-- Drivers can view pending rides
CREATE POLICY "Drivers can view pending rides"
ON public.rides FOR SELECT TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'driver' AND status = 'pending')
);

-- Drivers can accept pending rides
CREATE POLICY "Drivers can accept pending rides"
ON public.rides FOR UPDATE TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'driver' AND status = 'pending')
) WITH CHECK (
  (public.get_user_type(auth.uid()) = 'driver' AND status = 'accepted' AND driver_id = auth.uid())
);

-- Drivers can view and update their accepted rides
CREATE POLICY "Drivers can view and update their accepted rides"
ON public.rides FOR ALL TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'driver' AND driver_id = auth.uid() AND status IN ('accepted', 'completed', 'cancelled'))
) WITH CHECK (
  (public.get_user_type(auth.uid()) = 'driver' AND driver_id = auth.uid())
);

-- Drivers can delete their completed/cancelled rides
CREATE POLICY "Drivers can delete their completed/cancelled rides"
ON public.rides FOR DELETE TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'driver' AND driver_id = auth.uid() AND status IN ('completed', 'cancelled'))
);

-- Passengers can delete their completed/cancelled rides
CREATE POLICY "Passengers can delete their completed/cancelled rides"
ON public.rides FOR DELETE TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'passenger' AND passenger_id = auth.uid() AND status IN ('completed', 'cancelled'))
);

-- 10. Re-create RLS policies for settings
-- Admins can view settings
CREATE POLICY "Admins can view settings"
ON public.settings FOR SELECT TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
);

-- Admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.settings FOR INSERT TO authenticated WITH CHECK (
  (public.get_user_type(auth.uid()) = 'admin')
);

-- Admins can update settings
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
) WITH CHECK (
  (public.get_user_type(auth.uid()) = 'admin')
);