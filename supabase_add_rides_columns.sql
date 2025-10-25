-- Add passenger_id column
ALTER TABLE public.rides
ADD COLUMN passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add driver_id column
ALTER TABLE public.rides
ADD COLUMN driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- If you have existing rides data, you might need to update them
-- For example, to set a default passenger_id for existing rows if needed
-- UPDATE public.rides SET passenger_id = 'some_existing_user_uuid' WHERE passenger_id IS NULL;