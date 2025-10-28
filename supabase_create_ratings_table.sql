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

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read ratings"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create ratings for completed rides they were part of"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = rater_id AND
    (SELECT COUNT(*) FROM public.rides
     WHERE
        rides.id = NEW.ride_id AND
        rides.status = 'completed' AND
        (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    ) > 0
    AND
    (SELECT COUNT(*) FROM public.ratings
     WHERE
        ratings.ride_id = NEW.ride_id AND
        ratings.rater_id = auth.uid()
    ) = 0
);

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