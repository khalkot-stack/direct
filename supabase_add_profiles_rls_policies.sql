-- Enable Row Level Security for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view and update their own profile
DROP POLICY IF EXISTS "Authenticated users can view and update their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view and update their own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for drivers to view passenger profiles for their accepted rides
DROP POLICY IF EXISTS "Drivers can view passenger profiles for their accepted rides" ON public.profiles;
CREATE POLICY "Drivers can view passenger profiles for their accepted rides"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.driver_id = auth.uid()
    AND rides.passenger_id = profiles.id
    AND rides.status = 'accepted'
  )
);

-- Policy for passengers to view driver profiles for their accepted rides
DROP POLICY IF EXISTS "Passengers can view driver profiles for their accepted rides" ON public.profiles;
CREATE POLICY "Passengers can view driver profiles for their accepted rides"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.passenger_id = auth.uid()
    AND rides.driver_id = profiles.id
    AND rides.status = 'accepted'
  )
);

-- Policy for admins to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
  user_type_from_profiles(auth.uid()) = 'admin'
)
WITH CHECK (
  user_type_from_profiles(auth.uid()) = 'admin'
);