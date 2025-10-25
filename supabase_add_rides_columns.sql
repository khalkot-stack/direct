-- Add passenger_id column
ALTER TABLE public.rides
ADD COLUMN passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add driver_id column
ALTER TABLE public.rides
ADD COLUMN driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;