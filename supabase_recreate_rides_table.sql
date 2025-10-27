-- Drop the existing rides table if it exists
DROP TABLE IF EXISTS public.rides CASCADE;

-- Create the rides table
CREATE TABLE public.rides (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    passenger_id uuid NOT NULL,
    driver_id uuid,
    pickup_location text NOT NULL,
    destination text NOT NULL,
    passengers_count integer NOT NULL DEFAULT 1 CHECK (passengers_count >= 1),
    status text CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create an index on passenger_id for faster lookups
CREATE INDEX rides_passenger_id_idx ON public.rides (passenger_id);

-- Create an index on driver_id for faster lookups
CREATE INDEX rides_driver_id_idx ON public.rides (driver_id);

-- Create an index on status for faster lookups
CREATE INDEX rides_status_idx ON public.rides (status);

-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();