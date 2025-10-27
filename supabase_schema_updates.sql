-- SQL to add car details to profiles table if not already added
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS car_model text,
ADD COLUMN IF NOT EXISTS car_color text,
ADD COLUMN IF NOT EXISTS license_plate text;

-- SQL to create ratings table if not already created
CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ride_id uuid NOT NULL,
    rater_id uuid NOT NULL,
    rated_user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    CONSTRAINT ratings_pkey PRIMARY KEY (id),
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

-- Enable Row Level Security for ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policy for ratings table (adjust as needed for your security model)
-- This policy allows all authenticated users to insert, select, update, delete ratings.
-- You might want to refine this, e.g., only allow rater_id to insert/update their own rating,
-- and only allow rated_user_id to select ratings for themselves.
CREATE POLICY "Allow all authenticated users to manage ratings"
ON public.ratings
FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

-- Add foreign key constraints for ratings table
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS "ratings_ride_id_fkey";
ALTER TABLE public.ratings ADD CONSTRAINT "ratings_ride_id_fkey" FOREIGN KEY (ride_id) REFERENCES public.rides(id) ON DELETE CASCADE;

ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS "ratings_rater_id_fkey";
ALTER TABLE public.ratings ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY (rater_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS "ratings_rated_user_id_fkey";
ALTER TABLE public.ratings ADD CONSTRAINT "ratings_rated_user_id_fkey" FOREIGN KEY (rated_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- SQL to add latitude and longitude columns to rides table if not already added
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS pickup_lat double precision,
ADD COLUMN IF NOT EXISTS pickup_lng double precision,
ADD COLUMN IF NOT EXISTS destination_lat double precision,
ADD COLUMN IF NOT EXISTS destination_lng double precision;