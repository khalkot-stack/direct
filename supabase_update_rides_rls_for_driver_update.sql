-- Enable RLS for the 'rides' table if not already enabled
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policy to allow drivers to SELECT rides (already exists, but good to confirm)
DROP POLICY IF EXISTS "Drivers can view pending and their accepted/completed rides." ON public.rides;
CREATE POLICY "Drivers can view pending and their accepted/completed rides."
ON public.rides FOR SELECT USING (
  (status = 'pending') OR
  (driver_id = auth.uid() AND status IN ('accepted', 'completed', 'cancelled'))
);

-- Policy to allow drivers to UPDATE rides they accept (new or updated)
DROP POLICY IF EXISTS "Drivers can update their accepted rides status and driver_id." ON public.rides;
CREATE POLICY "Drivers can update their accepted rides status and driver_id."
ON public.rides FOR UPDATE USING (
  (auth.uid() = driver_id) OR -- Driver can update their own accepted rides
  (auth.uid() IS NOT NULL AND status = 'pending' AND driver_id IS NULL) -- Driver can accept a pending ride (set driver_id and status)
) WITH CHECK (
  (auth.uid() = driver_id) OR -- Ensure driver_id is set to auth.uid() when accepting
  (auth.uid() IS NOT NULL AND status = 'pending' AND driver_id IS NULL)
);

-- Policy to allow passengers to SELECT their own rides (already exists, but good to confirm)
DROP POLICY IF EXISTS "Passengers can view their own rides." ON public.rides;
CREATE POLICY "Passengers can view their own rides."
ON public.rides FOR SELECT USING (
  passenger_id = auth.uid()
);

-- Policy to allow passengers to INSERT new rides (already exists, but good to confirm)
DROP POLICY IF EXISTS "Passengers can create rides." ON public.rides;
CREATE POLICY "Passengers can create rides."
ON public.rides FOR INSERT WITH CHECK (
  passenger_id = auth.uid()
);

-- Policy to allow passengers to UPDATE their pending/accepted rides (e.g., cancel)
DROP POLICY IF EXISTS "Passengers can update their own rides (e.g., cancel)." ON public.rides;
CREATE POLICY "Passengers can update their own rides (e.g., cancel)."
ON public.rides FOR UPDATE USING (
  (passenger_id = auth.uid()) AND (status IN ('pending', 'accepted'))
) WITH CHECK (
  (passenger_id = auth.uid()) AND (status IN ('pending', 'accepted', 'cancelled')) -- Allow status to change to cancelled
);

-- Policy to allow admins full access (already exists, but good to confirm)
DROP POLICY IF EXISTS "Admins can manage all rides." ON public.rides;
CREATE POLICY "Admins can manage all rides."
ON public.rides FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'admin')
);