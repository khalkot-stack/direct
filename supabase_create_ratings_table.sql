-- Drop table and dependent objects if they exist to ensure a clean recreation
DROP TRIGGER IF EXISTS check_rating_constraints_trigger ON public.ratings;
DROP FUNCTION IF EXISTS check_rating_constraints() CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;

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

-- Create a BEFORE INSERT trigger function for complex validation
CREATE FUNCTION check_rating_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run as the table owner to access other tables
AS $$
DECLARE
    ride_status text;
    passenger_id_from_ride uuid;
    driver_id_from_ride uuid;
    existing_rating_count integer;
BEGIN
    -- 1. Check if the rater_id matches the authenticated user
    IF NEW.rater_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'You can only create ratings for yourself.';
    END IF;

    -- 2. Check if the ride is completed and the rater was either passenger or driver
    SELECT status, passenger_id, driver_id
    INTO ride_status, passenger_id_from_ride, driver_id_from_ride
    FROM public.rides
    WHERE id = NEW.ride_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ride with ID % not found.', NEW.ride_id;
    END IF;

    IF ride_status IS DISTINCT FROM 'completed' THEN
        RAISE EXCEPTION 'You can only rate completed rides.';
    END IF;

    IF NOT (NEW.rater_id = passenger_id_from_ride OR NEW.rater_id = driver_id_from_ride) THEN
        RAISE EXCEPTION 'You must be either the passenger or the driver of this ride to rate it.';
    END IF;

    -- 3. Check if the rated_user_id is correct (driver if rater is passenger, or vice versa)
    IF NEW.rater_id = passenger_id_from_ride AND NEW.rated_user_id IS DISTINCT FROM driver_id_from_ride THEN
        RAISE EXCEPTION 'As a passenger, you can only rate the driver of this ride.';
    END IF;

    IF NEW.rater_id = driver_id_from_ride AND NEW.rated_user_id IS DISTINCT FROM passenger_id_from_ride THEN
        RAISE EXCEPTION 'As a driver, you can only rate the passenger of this ride.';
    END IF;

    -- 4. Check if the user has already rated this specific ride
    SELECT COUNT(*)
    INTO existing_rating_count
    FROM public.ratings
    WHERE ride_id = NEW.ride_id AND rater_id = NEW.rater_id;

    IF existing_rating_count > 0 THEN
        RAISE EXCEPTION 'You have already rated this ride.';
    END IF;

    RETURN NEW;
END;
$$;

-- Apply the trigger to the ratings table
CREATE TRIGGER check_rating_constraints_trigger
BEFORE INSERT ON public.ratings
FOR EACH ROW EXECUTE FUNCTION check_rating_constraints();

-- Policy: Allow authenticated users to create ratings (simplified, as trigger handles complex checks)
CREATE POLICY "Allow authenticated users to create ratings"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = rater_id AND
    NEW.rated_user_id IS NOT NULL -- Ensure a rated user is provided
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