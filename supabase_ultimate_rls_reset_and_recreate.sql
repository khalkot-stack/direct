-- 1. Disable RLS on all affected tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

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

-- 5. Drop all known RLS policies from ratings table
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;

-- 6. Drop all known RLS policies from messages table
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

-- 7. Drop the get_user_type function with CASCADE to remove any dependent objects
DROP FUNCTION IF EXISTS public.get_user_type(uuid) CASCADE;

-- 8. Drop the trigger and trigger function for new user metadata if they exist (related to app_metadata)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_metadata() CASCADE;

-- 9. Re-create the get_user_type function to read from auth.users raw_user_meta_data
-- This is the fallback since app_metadata column is reported as missing.
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER -- SECURITY DEFINER is important for RLS functions
AS $function$
DECLARE
  u_type text;
BEGIN
  -- Retrieve user_type from auth.users.raw_user_meta_data
  SELECT (raw_user_meta_data->>'user_type') INTO u_type
  FROM auth.users
  WHERE id = user_id;
  RETURN u_type;
END;
$function$;

-- 10. No need for handle_new_user_metadata trigger or function if app_metadata is missing.
-- The frontend already sets user_type in raw_user_meta_data during signup.

-- 11. No need to update app_metadata for existing users if the column doesn't exist.

-- 12. Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 13. Re-create essential RLS policies for profiles (self-access, admin, and cross-user)
-- Self-access policies (DO NOT use get_user_type here for direct self-check)
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

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
);

-- Allow drivers to view passenger profiles for their rides
CREATE POLICY "Allow drivers to view passenger profiles for their rides"
ON public.profiles FOR SELECT TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'driver' AND EXISTS (
    SELECT 1 FROM public.rides
    WHERE (rides.driver_id = auth.uid() AND rides.passenger_id = profiles.id)
  ))
);

-- Allow passengers to view driver profiles for their accepted rides
CREATE POLICY "Allow passengers to view driver profiles for their accepted rides"
ON public.profiles FOR SELECT TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'passenger' AND EXISTS (
    SELECT 1 FROM public.rides
    WHERE (rides.passenger_id = auth.uid() AND rides.driver_id = profiles.id AND rides.status = 'accepted')
  ))
);

-- 14. Re-create RLS policies for rides
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

-- 15. Re-create RLS policies for settings
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

-- 16. Re-create RLS policies for ratings
-- Allow authenticated users to insert ratings
CREATE POLICY "Allow authenticated users to insert ratings"
ON public.ratings FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = rater_id)
);

-- Allow authenticated users to view ratings
CREATE POLICY "Allow authenticated users to view ratings"
ON public.ratings FOR SELECT TO authenticated USING (
  (auth.uid() = rater_id) OR
  (public.get_user_type(auth.uid()) = 'admin') OR
  (public.get_user_type(auth.uid()) = 'driver' AND rated_user_id = auth.uid()) OR
  (public.get_user_type(auth.uid()) = 'passenger' AND rater_id = auth.uid())
);

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings"
ON public.ratings FOR ALL TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
);

-- 17. Re-create RLS policies for messages
-- Allow authenticated users to send messages
CREATE POLICY "Allow authenticated users to send messages"
ON public.messages FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = sender_id) AND (
    EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid()))
  )
);

-- Allow authenticated users to view messages
CREATE POLICY "Allow authenticated users to view messages"
ON public.messages FOR SELECT TO authenticated USING (
  (auth.uid() = sender_id) OR (auth.uid() = receiver_id) OR
  (public.get_user_type(auth.uid()) = 'admin') OR
  (EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid())))
);

-- Admins can manage all messages
ON public.messages FOR ALL TO authenticated USING (
  (public.get_user_type(auth.uid()) = 'admin')
);