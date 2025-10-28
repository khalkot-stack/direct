-- Enable Row Level Security for the 'rides' table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policy for drivers to select their accepted rides
DROP POLICY IF EXISTS "Drivers can view their accepted rides" ON public.rides;
CREATE POLICY "Drivers can view their accepted rides"
ON public.rides FOR SELECT
TO authenticated
USING (
  auth.uid() = driver_id AND status = 'accepted'
);

-- Policy for drivers to update their accepted rides (e.g., change status to completed/cancelled)
DROP POLICY IF EXISTS "Drivers can update their accepted rides" ON public.rides;
CREATE POLICY "Drivers can update their accepted rides"
ON public.rides FOR UPDATE
TO authenticated
USING (
  auth.uid() = driver_id AND status = 'accepted'
)
WITH CHECK (
  auth.uid() = driver_id AND (status = 'completed' OR status = 'cancelled')
);

-- Policy for drivers to insert new rides (if they can create rides, though current app flow is passenger-initiated)
DROP POLICY IF EXISTS "Drivers can insert new rides" ON public.rides;
CREATE POLICY "Drivers can insert new rides"
ON public.rides FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = driver_id AND user_type_from_profiles(auth.uid()) = 'driver'
);

-- Policy for passengers to select their own rides (pending, accepted, completed, cancelled)
DROP POLICY IF EXISTS "Passengers can view their own rides" ON public.rides;
CREATE POLICY "Passengers can view their own rides"
ON public.rides FOR SELECT
TO authenticated
USING (
  auth.uid() = passenger_id
);

-- Policy for passengers to insert new rides
DROP POLICY IF EXISTS "Passengers can insert new rides" ON public.rides;
CREATE POLICY "Passengers can insert new rides"
ON public.rides FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = passenger_id AND user_type_from_profiles(auth.uid()) = 'passenger'
);

-- Policy for passengers to update their own rides (e.g., cancel a pending/accepted ride)
DROP POLICY IF EXISTS "Passengers can update their own rides" ON public.rides;
CREATE POLICY "Passengers can update their own rides"
ON public.rides FOR UPDATE
TO authenticated
USING (
  auth.uid() = passenger_id AND (status = 'pending' OR status = 'accepted')
)
WITH CHECK (
  auth.uid() = passenger_id AND status = 'cancelled'
);

-- Policy for authenticated users to view pending rides (for drivers to find rides)
DROP POLICY IF EXISTS "Authenticated users can view pending rides" ON public.rides;
CREATE POLICY "Authenticated users can view pending rides"
ON public.rides FOR SELECT
TO authenticated
USING (
  status = 'pending'
);

-- Policy for admins to do anything
DROP POLICY IF EXISTS "Admins can manage all rides" ON public.rides;
CREATE POLICY "Admins can manage all rides"
ON public.rides FOR ALL
TO authenticated
USING (
  user_type_from_profiles(auth.uid()) = 'admin'
)
WITH CHECK (
  user_type_from_profiles(auth.uid()) = 'admin'
);

-- Ensure the user_type_from_profiles function exists (if not already created)
CREATE OR REPLACE FUNCTION user_type_from_profiles(user_uuid uuid)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  u_type TEXT;
BEGIN
  SELECT user_type INTO u_type FROM public.profiles WHERE id = user_uuid;
  RETURN u_type;
END;
$$;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.user_type_from_profiles(uuid) TO authenticated;