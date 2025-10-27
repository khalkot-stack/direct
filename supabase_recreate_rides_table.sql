-- Delete the existing 'rides' table if it exists
DROP TABLE IF EXISTS public.rides CASCADE;

-- Create the 'rides' table
CREATE TABLE public.rides (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_location text NOT NULL,
    destination text NOT NULL,
    passengers_count integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) for the 'rides' table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create policies for the 'rides' table

-- Policy for passengers to view their own rides
CREATE POLICY "Passengers can view their own rides" ON public.rides
FOR SELECT USING (
  auth.uid() = passenger_id
);

-- Policy for passengers to create rides
CREATE POLICY "Passengers can create rides" ON public.rides
FOR INSERT WITH CHECK (
  auth.uid() = passenger_id
);

-- Policy for passengers to update their own pending rides (e.g., cancel)
CREATE POLICY "Passengers can update their own pending rides" ON public.rides
FOR UPDATE USING (
  auth.uid() = passenger_id AND status = 'pending'
) WITH CHECK (
  auth.uid() = passenger_id
);

-- Policy for drivers to view pending rides and their accepted/completed rides
CREATE POLICY "Drivers can view pending and their accepted/completed rides" ON public.rides
FOR SELECT USING (
  status = 'pending' OR (auth.uid() = driver_id AND status IN ('accepted', 'completed'))
);

-- Policy for drivers to accept pending rides
CREATE POLICY "Drivers can accept pending rides" ON public.rides
FOR UPDATE USING (
  status = 'pending' AND auth.uid() IS NOT NULL AND driver_id IS NULL
) WITH CHECK (
  auth.uid() = driver_id AND status = 'accepted'
);

-- Policy for drivers to complete their accepted rides
CREATE POLICY "Drivers can complete their accepted rides" ON public.rides
FOR UPDATE USING (
  auth.uid() = driver_id AND status = 'accepted'
) WITH CHECK (
  auth.uid() = driver_id AND status = 'completed'
);

-- Policy for admins to manage all rides
CREATE POLICY "Admins can manage all rides" ON public.rides
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Create a trigger to update 'updated_at' timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');