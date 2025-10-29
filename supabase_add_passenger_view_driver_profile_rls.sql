-- Enable Row Level Security for the profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts or needs to be replaced
DROP POLICY IF EXISTS "Passengers can view driver profiles for accepted rides" ON public.profiles;

-- Create a new RLS policy to allow passengers to view driver profiles for accepted rides
CREATE POLICY "Passengers can view driver profiles for accepted rides"
ON public.profiles FOR SELECT TO authenticated USING (
  (
    -- Check if the current authenticated user (auth.uid()) is a passenger
    -- in an accepted ride where 'profiles.id' is the driver_id
    auth.uid() IN (
      SELECT rides.passenger_id
      FROM public.rides
      WHERE
        rides.driver_id = profiles.id AND rides.status = 'accepted'
    )
  )
);