-- Set search path to public
SET search_path = public;

-- Create ENUM types
CREATE TYPE public.user_type_enum AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE public.user_status_enum AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE public.ride_status_enum AS ENUM ('pending', 'accepted', 'completed', 'cancelled');

-- Create tables

-- profiles table
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    username text UNIQUE,
    website text,
    avatar_url text,
    user_type user_type_enum DEFAULT 'passenger'::public.user_type_enum NOT NULL,
    car_model text,
    car_color text,
    license_plate text,
    phone_number text,
    status user_status_enum DEFAULT 'active'::public.user_status_enum NOT NULL,
    current_lat numeric,
    current_lng numeric,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- rides table
CREATE TABLE public.rides (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_location text NOT NULL,
    pickup_lat numeric NOT NULL,
    pickup_lng numeric NOT NULL,
    destination text NOT NULL,
    destination_lat numeric NOT NULL,
    destination_lng numeric NOT NULL,
    passengers_count integer DEFAULT 1 NOT NULL,
    status ride_status_enum DEFAULT 'pending'::public.ride_status_enum NOT NULL,
    price numeric,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    ride_date date,
    ride_time time with time zone,
    driver_notes text,
    passenger_notes text
);
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- settings table
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    commission_rate numeric DEFAULT 10.0 NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ratings table
CREATE TABLE public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- messages table
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Functions and Triggers
--

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type_enum, 'passenger'),
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user() on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for admin to get all profiles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_user_role text;
BEGIN
  SELECT raw_user_meta_data->>'user_type' INTO current_user_role
  FROM auth.users
  WHERE id = auth.uid();

  IF current_user_role = 'admin' THEN
    SET LOCAL row_level_security.active = false;
    RETURN QUERY SELECT * FROM public.profiles;
  ELSE
    RAISE EXCEPTION 'Access denied: Only admins can call this function.';
  END IF;
END;
$$;

--
-- RLS Policies
--

-- Policies for public.profiles
CREATE POLICY "Allow self-read access to profiles" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow self-insert access to profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow self-update access to profiles" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for public.rides
CREATE POLICY "Allow passengers to read their own rides" ON public.rides
FOR SELECT USING (passenger_id = auth.uid());

CREATE POLICY "Allow drivers to read rides assigned to them" ON public.rides
FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Admins can read all rides" ON public.rides
FOR SELECT USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow passengers to insert rides" ON public.rides
FOR INSERT WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Admins can insert rides" ON public.rides
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow drivers to update rides assigned to them" ON public.rides
FOR UPDATE USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Allow passengers to cancel their pending/accepted rides" ON public.rides
FOR UPDATE USING (passenger_id = auth.uid() AND status IN ('pending', 'accepted'))
WITH CHECK (passenger_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Admins can update rides" ON public.rides
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow drivers to delete completed rides" ON public.rides
FOR DELETE USING (driver_id = auth.uid() AND status = 'completed');

CREATE POLICY "Allow passengers to delete completed/cancelled rides" ON public.rides
FOR DELETE USING (passenger_id = auth.uid() AND status IN ('completed', 'cancelled'));

CREATE POLICY "Admins can delete rides" ON public.rides
FOR DELETE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for public.settings
CREATE POLICY "Admins can view settings" ON public.settings
FOR SELECT USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can insert settings" ON public.settings
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update settings" ON public.settings
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for public.ratings
CREATE POLICY "Allow authenticated users to view ratings" ON public.ratings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ratings" ON public.ratings
FOR INSERT WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own ratings" ON public.ratings
FOR UPDATE USING (rater_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own ratings" ON public.ratings
FOR DELETE USING (rater_id = auth.uid());

CREATE POLICY "Admins can manage all ratings" ON public.ratings
FOR ALL USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for public.messages
CREATE POLICY "Allow authenticated users to view messages" ON public.messages
FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Allow authenticated users to insert messages" ON public.messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own messages" ON public.messages
FOR DELETE USING (sender_id = auth.uid());

CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Reset search path
RESET search_path;