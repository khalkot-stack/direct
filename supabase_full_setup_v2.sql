-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  username text UNIQUE,
  website text,
  avatar_url text,
  user_type text DEFAULT 'passenger'::text NOT NULL,
  car_model text,
  car_color text,
  license_plate text,
  phone_number text,
  status text DEFAULT 'active'::text NOT NULL,
  current_lat double precision,
  current_lng double precision,
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX profiles_user_type_idx ON public.profiles (user_type);
CREATE INDEX profiles_status_idx ON public.profiles (status);

-- Create rides table
CREATE TABLE public.rides (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_location text NOT NULL,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  destination text NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  passengers_count integer NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  price numeric,
  requested_at timestamp with time zone DEFAULT now() NOT NULL,
  accepted_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  ride_date date,
  ride_time time with time zone,
  driver_notes text,
  passenger_notes text,
  cancellation_reason text
);

-- Add indexes for performance
CREATE INDEX rides_passenger_id_idx ON public.rides (passenger_id);
CREATE INDEX rides_driver_id_idx ON public.rides (driver_id);
CREATE INDEX rides_status_idx ON public.rides (status);
CREATE INDEX rides_pickup_location_idx ON public.rides (pickup_location);
CREATE INDEX rides_destination_idx ON public.rides (destination);

-- Create ratings table
CREATE TABLE public.ratings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX ratings_ride_id_idx ON public.ratings (ride_id);
CREATE INDEX ratings_rater_id_idx ON public.ratings (rater_id);
CREATE INDEX ratings_rated_user_id_idx ON public.ratings (rated_user_id);

-- Create settings table
CREATE TABLE public.settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  commission_rate numeric DEFAULT 10.0 NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert a default settings row if it doesn't exist
INSERT INTO public.settings (id, commission_rate, notifications_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 10.0, true)
ON CONFLICT (id) DO NOTHING;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX notifications_read_at_idx ON public.notifications (read_at);

-- Create messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX messages_ride_id_idx ON public.messages (ride_id);
CREATE INDEX messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX messages_receiver_id_idx ON public.messages (receiver_id);

-- Create a function to get user type from auth.users raw_user_meta_data
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  u_type text;
BEGIN
  SELECT raw_user_meta_data->>'user_type' INTO u_type
  FROM auth.users
  WHERE id = user_id;
  RETURN u_type;
END;
$$;

-- Create a function to get all profiles for admin
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure only authenticated admins can call this function
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'user_type' = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Only administrators can view all profiles.';
  END IF;

  RETURN QUERY SELECT * FROM public.profiles;
END;
$$;

-- Create a trigger to handle new user sign-ups
CREATE OR FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'status', 'active')
  );
  RETURN NEW;
END;
$$;

-- Link the trigger to auth.users inserts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow all authenticated users to read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow passengers to view driver profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE (rides.passenger_id = auth.uid() AND rides.driver_id = profiles.id)
      OR (rides.driver_id = auth.uid() AND rides.passenger_id = profiles.id)
    )
    AND public.get_user_type(auth.uid()) = 'passenger'
  );

CREATE POLICY "Allow admins to manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');

-- RLS Policies for rides table
CREATE POLICY "Allow passengers to insert rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = passenger_id AND status = 'pending');

CREATE POLICY "Allow passengers to view their own rides" ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Allow drivers to view rides assigned to them" ON public.rides
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Allow drivers to update status of their assigned rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Allow passengers to update their own pending rides to cancelled" ON public.rides
  FOR UPDATE USING (auth.uid() = passenger_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Allow admins to manage all rides" ON public.rides
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');

CREATE POLICY "Allow passengers to delete their own completed/cancelled rides" ON public.rides
  FOR DELETE USING (auth.uid() = passenger_id AND (status = 'completed' OR status = 'cancelled'));

CREATE POLICY "Allow drivers to delete their own completed/cancelled rides" ON public.rides
  FOR DELETE USING (auth.uid() = driver_id AND (status = 'completed' OR status = 'cancelled'));

-- RLS Policies for ratings table
CREATE POLICY "Allow authenticated users to insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Allow users to view ratings for rides they are involved in" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE (rides.id = ratings.ride_id AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid()))
    )
  );

CREATE POLICY "Allow admins to manage all ratings" ON public.ratings
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');

-- RLS Policies for settings table
CREATE POLICY "Allow authenticated users to read settings" ON public.settings
  FOR SELECT USING (true); -- All authenticated users can read settings

CREATE POLICY "Allow admins to manage settings" ON public.settings
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');

-- RLS Policies for notifications table
CREATE POLICY "Allow authenticated users to insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.get_user_type(auth.uid()) = 'admin');

CREATE POLICY "Allow users to view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications (mark as read)" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to manage all notifications" ON public.notifications
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');

-- RLS Policies for messages table
CREATE POLICY "Allow authenticated users to insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow users to view messages in their rides" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE (rides.id = messages.ride_id AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid()))
    )
  );

CREATE POLICY "Allow admins to manage all messages" ON public.messages
  FOR ALL USING (public.get_user_type(auth.uid()) = 'admin');