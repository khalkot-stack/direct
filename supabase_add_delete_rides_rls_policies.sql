-- Enable RLS on the 'rides' table if not already enabled
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policy for passengers to delete their own rides
-- This policy allows passengers to delete rides they requested,
-- including pending, cancelled, and completed rides from their history.
DROP POLICY IF EXISTS "Passengers can delete their own pending, cancelled, or completed rides." ON public.rides;
CREATE POLICY "Passengers can delete their own pending, cancelled, or completed rides."
ON public.rides FOR DELETE
TO authenticated
USING (
  auth.uid() = passenger_id AND (status = 'pending' OR status = 'cancelled' OR status = 'completed')
);

-- Policy for drivers to delete their own rides
-- This policy allows drivers to delete rides they were assigned to,
-- typically after the ride is completed or cancelled.
DROP POLICY IF EXISTS "Drivers can delete their own completed or cancelled rides." ON public.rides;
CREATE POLICY "Drivers can delete their own completed or cancelled rides."
ON public.rides FOR DELETE
TO authenticated
USING (
  auth.uid() = driver_id AND (status = 'completed' OR status = 'cancelled')
);

-- Policy for admins to delete any ride
-- This policy grants delete access to users with 'admin' user_type in the profiles table.
DROP POLICY IF EXISTS "Admins can delete any ride." ON public.rides;
CREATE POLICY "Admins can delete any ride."
ON public.rides FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);