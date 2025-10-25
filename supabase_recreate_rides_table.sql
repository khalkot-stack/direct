-- WARNING: This script will DELETE ALL DATA in your 'rides' table.
-- Only run this if you are in a development environment and can afford to lose existing ride data.

-- 1. Drop the existing 'rides' table
DROP TABLE IF EXISTS public.rides CASCADE;

-- 2. Recreate the 'rides' table with 'id' as UUID primary key, foreign keys, and created_at
CREATE TABLE public.rides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_location text NOT NULL,
    destination text NOT NULL,
    passengers_count integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'pending'::text, -- pending, accepted, completed, cancelled
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Enable Row Level Security for the 'rides' table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- 4. Re-add RLS policies for the 'rides' table (as provided previously)
--    Admins can manage all rides
CREATE POLICY "Admins can manage all rides"
ON public.rides
FOR ALL
USING (get_user_type() = 'admin')
WITH CHECK (get_user_type() = 'admin');

--    Passengers can view their own rides
CREATE POLICY "Passengers can view their own rides"
ON public.rides
FOR SELECT
USING (passenger_id = auth.uid());

--    Passengers can create new ride requests
CREATE POLICY "Passengers can create new ride requests"
ON public.rides
FOR INSERT
WITH CHECK (passenger_id = auth.uid() AND status = 'pending');

--    Passengers can update their own pending rides (e.g., cancel)
CREATE POLICY "Passengers can update their own pending rides"
ON public.rides
FOR UPDATE
USING (passenger_id = auth.uid() AND status = 'pending')
WITH CHECK (passenger_id = auth.uid() AND status IN ('pending', 'cancelled'));

--    Passengers can delete their own pending rides
CREATE POLICY "Passengers can delete their own pending rides"
ON public.rides
FOR DELETE
USING (passenger_id = auth.uid() AND status = 'pending');

--    Drivers can view all pending rides
CREATE POLICY "Drivers can view all pending rides"
ON public.rides
FOR SELECT
USING (status = 'pending' AND get_user_type() = 'driver');

--    Drivers can view their accepted/completed rides
CREATE POLICY "Drivers can view their accepted/completed rides"
ON public.rides
FOR SELECT
USING (driver_id = auth.uid() AND get_user_type() = 'driver');

--    Drivers can accept a pending ride
CREATE POLICY "Drivers can accept a pending ride"
ON public.rides
FOR UPDATE
USING (status = 'pending' AND driver_id IS NULL AND get_user_type() = 'driver')
WITH CHECK (driver_id = auth.uid() AND status = 'accepted');

--    Drivers can complete/cancel their accepted rides
CREATE POLICY "Drivers can complete/cancel their accepted rides"
ON public.rides
FOR UPDATE
USING (driver_id = auth.uid() AND status = 'accepted' AND get_user_type() = 'driver')
WITH CHECK (driver_id = auth.uid() AND status IN ('completed', 'cancelled'));