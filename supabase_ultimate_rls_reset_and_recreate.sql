-- Drop all existing RLS policies on the profiles table
DROP POLICY IF EXISTS "Allow self-read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Drivers can read passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Passengers can read driver profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-insert access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Drop all existing RLS policies on the rides table
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to read rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to update rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Admins can manage all rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can read all rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can update rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can delete rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to cancel their pending/accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to delete completed rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to delete completed/cancelled rides" ON public.rides;


-- Ensure RLS is enabled on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Recreate the get_user_type function (ensure it's correct and security definer)
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- Added STABLE for better query planning
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT raw_user_meta_data->>'user_type' INTO user_role
  FROM auth.users
  WHERE id = user_id;

  RETURN user_role;
END;
$$;

--
-- RLS Policies for public.profiles
--

-- Allow users to read their own profile (minimal SELECT policy for testing)
CREATE POLICY "Allow self-read access to profiles" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- IMPORTANT: Temporarily REMOVED "Admins can read all profiles" policy to diagnose recursion.
-- If this fixes the issue, we will re-introduce a safer admin read policy.

-- Allow users to insert their own profile on signup
CREATE POLICY "Allow self-insert access to profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.get_user_type(auth.uid()) = 'admin');

-- Allow users to update their own profile
CREATE POLICY "Allow self-update access to profiles" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'admin');

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (public.get_user_type(auth.uid()) = 'admin');

--
-- RLS Policies for public.rides
--

-- Allow passengers to read their own rides
CREATE POLICY "Allow passengers to read their own rides" ON public.rides
FOR SELECT USING (passenger_id = auth.uid());

-- Allow drivers to read rides assigned to them
CREATE POLICY "Allow drivers to read rides assigned to them" ON public.rides
FOR SELECT USING (driver_id = auth.uid());

-- Allow admins to read all rides
CREATE POLICY "Admins can read all rides" ON public.rides
FOR SELECT USING (public.get_user_type(auth.uid()) = 'admin');

-- Allow passengers to insert new rides
CREATE POLICY "Allow passengers to insert rides" ON public.rides
FOR INSERT WITH CHECK (passenger_id = auth.uid());

-- Allow admins to insert rides
CREATE POLICY "Admins can insert rides" ON public.rides
FOR INSERT WITH CHECK (public.get_user_type(auth.uid()) = 'admin');

-- Allow drivers to update rides assigned to them (e.g., accept, complete)
CREATE POLICY "Allow drivers to update rides assigned to them" ON public.rides
FOR UPDATE USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid()); -- Ensure driver_id doesn't change

-- Allow passengers to cancel their pending/accepted rides
CREATE POLICY "Allow passengers to cancel their pending/accepted rides" ON public.rides
FOR UPDATE USING (passenger_id = auth.uid() AND status IN ('pending', 'accepted'))
WITH CHECK (passenger_id = auth.uid() AND status = 'cancelled'); -- Only allow status change to 'cancelled'

-- Allow admins to update all rides
CREATE POLICY "Admins can update rides" ON public.rides
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'admin');

-- Allow drivers to delete their completed rides
CREATE POLICY "Allow drivers to delete completed rides" ON public.rides
FOR DELETE USING (driver_id = auth.uid() AND status = 'completed');

-- Allow passengers to delete their completed or cancelled rides
CREATE POLICY "Allow passengers to delete completed/cancelled rides" ON public.rides
FOR DELETE USING (passenger_id = auth.uid() AND status IN ('completed', 'cancelled'));

-- Allow admins to delete all rides
CREATE POLICY "Admins can delete rides" ON public.rides
FOR DELETE USING (public.get_user_type(auth.uid()) = 'admin');