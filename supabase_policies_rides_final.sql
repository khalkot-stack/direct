-- 1. Enable Row Level Security on the 'rides' table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- 2. Policy for Admins: Full access to all rides
CREATE POLICY "Admins can manage all rides"
ON public.rides
FOR ALL
USING (get_user_type() = 'admin')
WITH CHECK (get_user_type() = 'admin');

-- 3. Policy for Passengers: Select their own rides
CREATE POLICY "Passengers can view their own rides"
ON public.rides
FOR SELECT
USING (passenger_id = auth.uid());

-- 4. Policy for Passengers: Insert new ride requests
CREATE POLICY "Passengers can create new ride requests"
ON public.rides
FOR INSERT
WITH CHECK (passenger_id = auth.uid() AND status = 'pending');

-- 5. Policy for Passengers: Update their own pending rides (e.g., cancel)
CREATE POLICY "Passengers can update their own pending rides"
ON public.rides
FOR UPDATE
USING (passenger_id = auth.uid() AND status = 'pending')
WITH CHECK (passenger_id = auth.uid() AND status IN ('pending', 'cancelled'));

-- 6. Policy for Passengers: Delete their own pending rides
CREATE POLICY "Passengers can delete their own pending rides"
ON public.rides
FOR DELETE
USING (passenger_id = auth.uid() AND status = 'pending');

-- 7. Policy for Drivers: Select all pending rides
CREATE POLICY "Drivers can view all pending rides"
ON public.rides
FOR SELECT
USING (status = 'pending' AND get_user_type() = 'driver');

-- 8. Policy for Drivers: Select rides assigned to them
CREATE POLICY "Drivers can view their accepted/completed rides"
ON public.rides
FOR SELECT
USING (driver_id = auth.uid() AND get_user_type() = 'driver');

-- 9. Policy for Drivers: Update to accept a pending ride
CREATE POLICY "Drivers can accept a pending ride"
ON public.rides
FOR UPDATE
USING (status = 'pending' AND driver_id IS NULL AND get_user_type() = 'driver')
WITH CHECK (driver_id = auth.uid() AND status = 'accepted');

-- 10. Policy for Drivers: Update to complete/cancel their accepted rides
CREATE POLICY "Drivers can complete/cancel their accepted rides"
ON public.rides
FOR UPDATE
USING (driver_id = auth.uid() AND status = 'accepted' AND get_user_type() = 'driver')
WITH CHECK (driver_id = auth.uid() AND status IN ('completed', 'cancelled'));