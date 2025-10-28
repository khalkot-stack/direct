-- Drop table and dependent objects if they exist to ensure a clean recreation
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP FUNCTION IF EXISTS can_rate_ride(uuid, uuid);

-- Create the ratings table
CREATE TABLE public.ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (ride_id, rater_id) -- A user can only rate a specific ride once
);

-- Enable Row Level Security
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read ratings
CREATE POLICY "Allow all authenticated users to read ratings"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

-- Create helper function for complex RLS logic
CREATE FUNCTION can_rate_ride(p_ride_id uuid, p_rater_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the ride is completed and the rater was either passenger or driver
    IF NOT EXISTS (
        SELECT 1
        FROM public.rides
        WHERE
            rides.id = p_ride_id AND
            rides.status = 'completed' AND
            (rides.passenger_id = p_rater_id OR rides.driver_id = p_rater_id)
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check if the user has already rated this specific ride
    IF EXISTS (
        SELECT 1
        FROM public.ratings
        WHERE
            ratings.ride_id = p_ride_id AND
            ratings.rater_id = p_rater_id
    ) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Policy: Allow authenticated users to create ratings for completed rides they were part of
CREATE POLICY "Allow authenticated users to create ratings for completed rides they were part of"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = rater_id AND
    can_rate_ride(NEW.ride_id, auth.uid())
);

-- Policy: Allow authenticated users to update their own ratings
CREATE POLICY "Allow authenticated users to update their own ratings"
ON public.ratings FOR UPDATE
TO authenticated
USING (auth.uid() = rater_id)
WITH CHECK (auth.uid() = rater_id);

-- Optional: Allow admins to delete any rating
CREATE POLICY "Allow admins to delete any rating"
ON public.ratings FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'));