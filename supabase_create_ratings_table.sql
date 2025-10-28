-- Create the ratings table
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  
  -- Ensure a user can only rate a specific ride once
  UNIQUE (ride_id, rater_id)
);

-- Enable Row Level Security (RLS) for the ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the ratings table

-- Policy to allow users to read ratings related to them (as rater or rated user)
CREATE POLICY "Allow authenticated users to read their own and received ratings"
ON public.ratings FOR SELECT
USING (
  auth.uid() = rater_id OR auth.uid() = rated_user_id
);

-- Policy to allow authenticated users to insert a rating for a completed ride they were part of
CREATE POLICY "Allow authenticated users to insert ratings for completed rides they participated in"
ON public.ratings FOR INSERT
WITH CHECK (
  auth.uid() = rater_id AND
  EXISTS (
    SELECT 1
    FROM public.rides
    WHERE
      rides.id = ride_id AND
      rides.status = 'completed' AND
      (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
  )
);

-- Policy to allow authenticated users to update their own ratings
CREATE POLICY "Allow authenticated users to update their own ratings"
ON public.ratings FOR UPDATE
USING (auth.uid() = rater_id);

-- Policy to allow authenticated users to delete their own ratings
CREATE POLICY "Allow authenticated users to delete their own ratings"
ON public.ratings FOR DELETE
USING (auth.uid() = rater_id);