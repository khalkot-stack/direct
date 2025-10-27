-- Add foreign key constraint for passenger_id
ALTER TABLE public.rides
ADD CONSTRAINT rides_passenger_id_fkey
FOREIGN KEY (passenger_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for driver_id
ALTER TABLE public.rides
ADD CONSTRAINT rides_driver_id_fkey
FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create RLS policies for rides table
-- Passengers can view their own rides
CREATE POLICY "Passengers can view their own rides" ON public.rides
FOR SELECT USING (auth.uid() = passenger_id);

-- Passengers can insert new rides
CREATE POLICY "Passengers can insert rides" ON public.rides
FOR INSERT WITH CHECK (auth.uid() = passenger_id);

-- Passengers can update their pending rides (e.g., cancel)
CREATE POLICY "Passengers can update their pending rides" ON public.rides
FOR UPDATE USING (auth.uid() = passenger_id AND status = 'pending')
WITH CHECK (auth.uid() = passenger_id);

-- Drivers can view rides that are pending or accepted by them
CREATE POLICY "Drivers can view relevant rides" ON public.rides
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'driver')
  AND (status = 'pending' OR driver_id = auth.uid())
);

-- Drivers can accept pending rides
CREATE POLICY "Drivers can accept pending rides" ON public.rides
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'driver')
  AND status = 'pending'
  AND driver_id IS NULL -- Ensure no other driver has accepted it
) WITH CHECK (
  driver_id = auth.uid() AND status = 'accepted' -- Driver can only set themselves as driver and change status to accepted
);

-- Drivers can complete accepted rides
CREATE POLICY "Drivers can complete accepted rides" ON public.rides
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'driver')
  AND driver_id = auth.uid()
  AND status = 'accepted'
) WITH CHECK (
  driver_id = auth.uid() AND status = 'completed' -- Driver can only change status to completed
);

-- Admins can view all rides
CREATE POLICY "Admins can view all rides" ON public.rides
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Admins can insert new rides
CREATE POLICY "Admins can insert rides" ON public.rides
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Admins can update any ride
CREATE POLICY "Admins can update any ride" ON public.rides
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Admins can delete any ride
CREATE POLICY "Admins can delete any ride" ON public.rides
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);