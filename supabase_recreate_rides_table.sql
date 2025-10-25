-- 1. Create ride_status ENUM
DO $$ BEGIN
  CREATE TYPE public.ride_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop existing rides table if it exists
DROP TABLE IF EXISTS public.rides CASCADE;

-- 3. Create rides table
CREATE TABLE public.rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, -- Use UUID for consistency with profiles
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Driver can be null if not assigned
  pickup_location text NOT NULL,
  destination text NOT NULL,
  passengers_count integer NOT NULL DEFAULT 1,
  status public.ride_status DEFAULT 'pending'::public.ride_status NOT NULL
);

-- 4. Enable Row Level Security (RLS) for the rides table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for rides table
-- Passengers can view their own rides
CREATE POLICY "Passengers can view their own rides."
  ON public.rides FOR SELECT
  USING (auth.uid() = passenger_id);

-- Drivers can view pending rides and their accepted/completed rides
CREATE POLICY "Drivers can view relevant rides."
  ON public.rides FOR SELECT
  USING (
    (get_user_type() = 'driver' AND status = 'pending') OR
    (get_user_type() = 'driver' AND driver_id = auth.uid())
  );

-- Admins can view all rides
CREATE POLICY "Admins can view all rides."
  ON public.rides FOR SELECT
  USING (get_user_type() = 'admin');

-- Passengers can insert new rides
CREATE POLICY "Passengers can insert new rides."
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

-- Drivers can update rides they accept (set driver_id and status to accepted)
CREATE POLICY "Drivers can accept and complete their assigned rides."
  ON public.rides FOR UPDATE
  USING (
    (get_user_type() = 'driver' AND driver_id = auth.uid()) OR -- Driver can update their assigned rides
    (get_user_type() = 'driver' AND status = 'pending' AND NEW.driver_id = auth.uid() AND NEW.status = 'accepted') -- Driver can accept a pending ride
  )
  WITH CHECK (
    (get_user_type() = 'driver' AND driver_id = auth.uid()) OR
    (get_user_type() = 'driver' AND status = 'pending' AND NEW.driver_id = auth.uid() AND NEW.status = 'accepted')
  );

-- Admins can update all rides
CREATE POLICY "Admins can update all rides."
  ON public.rides FOR UPDATE
  USING (get_user_type() = 'admin')
  WITH CHECK (get_user_type() = 'admin');

-- Admins can delete rides
CREATE POLICY "Admins can delete rides."
  ON public.rides FOR DELETE
  USING (get_user_type() = 'admin');