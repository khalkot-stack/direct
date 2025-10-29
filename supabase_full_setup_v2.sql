-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE public.user_type_enum AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.profile_status_enum AS ENUM ('active', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ride_status_enum AS ENUM ('pending', 'accepted', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    email text,
    username text UNIQUE,
    website text,
    avatar_url text,
    user_type public.user_type_enum,
    car_model text,
    car_color text,
    license_plate text,
    phone_number text,
    status public.profile_status_enum DEFAULT 'active'::public.profile_status_enum NOT NULL,
    current_lat double precision,
    current_lng double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.rides (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    pickup_location text NOT NULL,
    pickup_lat double precision,
    pickup_lng double precision,
    destination text NOT NULL,
    destination_lat double precision,
    destination_lng double precision,
    passengers_count integer NOT NULL,
    status public.ride_status_enum DEFAULT 'pending'::public.ride_status_enum NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    rater_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rated_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    commission_rate numeric NOT NULL,
    notifications_enabled boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

-- Create functions
CREATE OR REPLACE FUNCTION public.get_user_type()
 RETURNS public.user_type_enum
 LANGUAGE plpgsql
 SECURITY INVOKER -- Runs with caller's permissions to access auth.uid()
AS $function$
DECLARE
  user_role public.user_type_enum;
BEGIN
  SELECT user_metadata->>'user_type' INTO user_role
  FROM auth.users
  WHERE id = auth.uid();

  RETURN user_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
 RETURNS SETOF public.profiles
 LANGUAGE plpgsql
 SECURITY DEFINER -- Runs with definer's permissions to bypass RLS on profiles
AS $function$
BEGIN
  IF public.get_user_type() = 'admin' THEN
    RETURN QUERY SELECT * FROM public.profiles;
  ELSE
    RAISE EXCEPTION 'Access denied. Only administrators can view all profiles.';
  END IF;
END;
$function$;

-- Create trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _user_type public.user_type_enum;
  _full_name text;
  _phone_number text;
  _status public.profile_status_enum;
BEGIN
  -- Extract user_type, full_name, phone_number, and status from new.raw_user_meta_data
  _user_type := COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type_enum, 'passenger');
  _full_name := NEW.raw_user_meta_data->>'full_name';
  _phone_number := NEW.raw_user_meta_data->>'phone_number';
  _status := COALESCE((NEW.raw_user_meta_data->>'status')::public.profile_status_enum, 'active');

  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number, status)
  VALUES (NEW.id, _full_name, NEW.email, _user_type, _phone_number, _status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles." ON public.profiles
  FOR SELECT USING (public.get_user_type() = 'admin');

DROP POLICY IF EXISTS "Admins can insert profiles." ON public.profiles;
CREATE POLICY "Admins can insert profiles." ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_type() = 'admin');

DROP POLICY IF EXISTS "Admins can update profiles." ON public.profiles;
CREATE POLICY "Admins can update profiles." ON public.profiles
  FOR UPDATE USING (public.get_user_type() = 'admin');

DROP POLICY IF EXISTS "Admins can delete profiles." ON public.profiles;
CREATE POLICY "Admins can delete profiles." ON public.profiles
  FOR DELETE USING (public.get_user_type() = 'admin');

-- RLS Policies for rides table
DROP POLICY IF EXISTS "Passengers can view their own rides." ON public.rides;
CREATE POLICY "Passengers can view their own rides." ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Drivers can view their accepted/completed rides." ON public.rides;
CREATE POLICY "Drivers can view their accepted/completed rides." ON public.rides
  FOR SELECT USING (auth.uid() = driver_id AND status IN ('accepted', 'completed', 'cancelled'));

DROP POLICY IF EXISTS "Drivers can view pending rides." ON public.rides;
CREATE POLICY "Drivers can view pending rides." ON public.rides
  FOR SELECT USING (public.get_user_type() = 'driver' AND status = 'pending');

DROP POLICY IF EXISTS "Passengers can request a ride." ON public.rides;
CREATE POLICY "Passengers can request a ride." ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = passenger_id AND public.get_user_type() = 'passenger');

DROP POLICY IF EXISTS "Drivers can accept pending rides." ON public.rides;
CREATE POLICY "Drivers can accept pending rides." ON public.rides
  FOR UPDATE USING (public.get_user_type() = 'driver' AND status = 'pending' AND driver_id IS NULL)
  WITH CHECK (auth.uid() = driver_id AND status = 'accepted');

DROP POLICY IF EXISTS "Drivers can update status of their accepted rides." ON public.rides;
CREATE POLICY "Drivers can update status of their accepted rides." ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id AND status = 'accepted')
  WITH CHECK (status IN ('completed', 'cancelled'));

DROP POLICY IF EXISTS "Passengers can cancel their pending/accepted rides." ON public.rides;
CREATE POLICY "Passengers can cancel their pending/accepted rides." ON public.rides
  FOR UPDATE USING (auth.uid() = passenger_id AND status IN ('pending', 'accepted'))
  WITH CHECK (status = 'cancelled');

DROP POLICY IF EXISTS "Passengers can delete their completed/cancelled rides." ON public.rides;
CREATE POLICY "Passengers can delete their completed/cancelled rides." ON public.rides
  FOR DELETE USING (auth.uid() = passenger_id AND status IN ('completed', 'cancelled'));

DROP POLICY IF EXISTS "Drivers can delete their completed/cancelled rides." ON public.rides;
CREATE POLICY "Drivers can delete their completed/cancelled rides." ON public.rides
  FOR DELETE USING (auth.uid() = driver_id AND status IN ('completed', 'cancelled'));

DROP POLICY IF EXISTS "Admins can manage all rides." ON public.rides;
CREATE POLICY "Admins can manage all rides." ON public.rides
  FOR ALL USING (public.get_user_type() = 'admin') WITH CHECK (public.get_user_type() = 'admin');

-- RLS Policies for ratings table
DROP POLICY IF EXISTS "All authenticated users can view ratings." ON public.ratings;
CREATE POLICY "All authenticated users can view ratings." ON public.ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Passengers can insert ratings for completed rides." ON public.ratings;
CREATE POLICY "Passengers can insert ratings for completed rides." ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    public.get_user_type() = 'passenger' AND
    EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND passenger_id = auth.uid() AND status = 'completed')
  );

DROP POLICY IF EXISTS "Admins can manage ratings." ON public.ratings;
CREATE POLICY "Admins can manage ratings." ON public.ratings
  FOR ALL USING (public.get_user_type() = 'admin') WITH CHECK (public.get_user_type() = 'admin');

-- RLS Policies for notifications table
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their own notifications as read." ON public.notifications;
CREATE POLICY "Users can mark their own notifications as read." ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications." ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- System can insert for any user

DROP POLICY IF EXISTS "Admins can delete notifications." ON public.notifications;
CREATE POLICY "Admins can delete notifications." ON public.notifications
  FOR DELETE USING (public.get_user_type() = 'admin');

-- RLS Policies for messages table
DROP POLICY IF EXISTS "Ride participants can view messages." ON public.messages;
CREATE POLICY "Ride participants can view messages." ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id OR
    EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Ride participants can send messages." ON public.messages;
CREATE POLICY "Ride participants can send messages." ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can delete messages." ON public.messages;
CREATE POLICY "Admins can delete messages." ON public.messages
  FOR DELETE USING (public.get_user_type() = 'admin');

-- RLS Policies for settings table
DROP POLICY IF EXISTS "All authenticated users can view settings." ON public.settings;
CREATE POLICY "All authenticated users can view settings." ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings
  FOR ALL USING (public.get_user_type() = 'admin') WITH CHECK (public.get_user_type() = 'admin');

-- RLS Policies for storage (avatars bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable." ON storage.objects;
CREATE POLICY "Avatar images are publicly readable." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
CREATE POLICY "Users can upload their own avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar." ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
CREATE POLICY "Users can delete their own avatar." ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);