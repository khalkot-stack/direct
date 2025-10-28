-- Drop existing SELECT policies for profiles to replace them with more granular ones
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile and linked accepted ride profiles" ON public.profiles;
DROP FUNCTION IF EXISTS is_linked_by_accepted_ride(uuid) CASCADE;

-- Create a helper function to check if the current user is linked to a target profile via an accepted ride
CREATE FUNCTION is_linked_by_accepted_ride(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER -- This is crucial: runs with the privileges of the calling user
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.rides
    WHERE
      status = 'accepted' AND
      (
        (passenger_id = target_profile_id AND driver_id = auth.uid()) OR -- Current user is driver, 'target_profile_id' is passenger of an accepted ride
        (driver_id = target_profile_id AND passenger_id = auth.uid())    -- Current user is passenger, 'target_profile_id' is driver of an accepted ride
      )
  );
END;
$$;

-- Policy 1: Admins can read all profiles (including sensitive data like phone numbers)
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- Policy 2: Authenticated users can read their own profile AND the profile (including phone number)
-- of a linked party in an 'accepted' ride, using the helper function.
CREATE POLICY "Users can read their own profile and linked accepted ride profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR -- User can always see their own profile
    is_linked_by_accepted_ride(id) -- Use the helper function to check for linked accepted rides
);

-- Keep existing UPDATE and INSERT policies as they are not affected by this change
-- Policy: Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow new users to create a profile
DROP POLICY IF EXISTS "Allow new users to create a profile" ON public.profiles;
CREATE POLICY "Allow new users to create a profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Allow admins to update all profiles
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;
CREATE POLICY "Allow admins to update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'));