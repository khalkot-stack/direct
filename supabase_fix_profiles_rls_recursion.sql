-- Drop all existing RLS policies on the profiles table to ensure a clean slate
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert of own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update of own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-insert access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow driver to view passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow passenger to view driver profiles for their rides" ON public.profiles;


-- Ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate the get_user_type function (ensure it's correct and security definer)
-- This function is crucial for RLS and should only query auth.users, not public.profiles
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 1. Policy for SELECT (Read access)
-- Allow users to view their own profile
CREATE POLICY "Allow self-read access to profiles" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT USING (public.get_user_type(auth.uid()) = 'admin');

-- Allow drivers to view passenger profiles for rides they are involved in
CREATE POLICY "Drivers can read passenger profiles for their rides" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rides
        WHERE (rides.driver_id = auth.uid() AND rides.passenger_id = profiles.id)
    )
);

-- Allow passengers to view driver profiles for rides they are involved in
CREATE POLICY "Passengers can read driver profiles for their rides" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rides
        WHERE (rides.passenger_id = auth.uid() AND rides.driver_id = profiles.id)
    )
);

-- 2. Policy for INSERT (Create access)
-- Allow users to create their own profile on signup
CREATE POLICY "Allow self-insert access to profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.get_user_type(auth.uid()) = 'admin');

-- 3. Policy for UPDATE (Modify access)
-- Allow users to update their own profile
CREATE POLICY "Allow self-update access to profiles" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'admin');

-- 4. Policy for DELETE (Delete access)
-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (public.get_user_type(auth.uid()) = 'admin');