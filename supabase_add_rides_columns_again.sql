-- Drop existing columns if they were created with incorrect types or constraints
ALTER TABLE public.rides DROP COLUMN IF EXISTS passenger_id;
ALTER TABLE public.rides DROP COLUMN IF EXISTS driver_id;

-- Add passenger_id column with UUID type and foreign key to public.profiles(id)
ALTER TABLE public.rides
ADD COLUMN passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add driver_id column with UUID type and foreign key to public.profiles(id)
ALTER TABLE public.rides
ADD COLUMN driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;