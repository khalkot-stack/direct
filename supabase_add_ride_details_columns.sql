-- Add missing columns to the 'rides' table if they don't exist
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ride_date DATE,
ADD COLUMN IF NOT EXISTS ride_time TIME WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS passenger_notes TEXT,
ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Ensure 'profiles' table has 'car_model', 'car_color', 'license_plate', 'current_lat', 'current_lng'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS license_plate TEXT,
ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;

-- Add foreign key to ratings table for ride_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_ride_id_fkey') THEN
        ALTER TABLE public.ratings
        ADD CONSTRAINT ratings_ride_id_fkey
        FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add foreign key to ratings table for rater_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_rater_id_fkey') THEN
        ALTER TABLE public.ratings
        ADD CONSTRAINT ratings_rater_id_fkey
        FOREIGN KEY (rater_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add foreign key to ratings table for rated_user_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_rated_user_id_fkey') THEN
        ALTER TABLE public.ratings
        ADD CONSTRAINT ratings_rated_user_id_fkey
        FOREIGN KEY (rated_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add foreign key to messages table for ride_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_ride_id_fkey') THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_ride_id_fkey
        FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add foreign key to messages table for sender_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey') THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_sender_id_fkey
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add foreign key to messages table for receiver_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey') THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_receiver_id_fkey
        FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;