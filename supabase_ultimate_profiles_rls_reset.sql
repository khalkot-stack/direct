-- Disable RLS for profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for profiles
DROP POLICY IF EXISTS "Allow all for admin" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow individual access" ON profiles;
DROP POLICY IF EXISTS "Allow passengers to view driver profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete own profile" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to view passenger profiles" ON profiles;
DROP POLICY IF EXISTS "Allow passengers to view driver profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin to manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to view other drivers" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to view passengers" ON profiles;
DROP POLICY IF EXISTS "Allow passengers to view drivers" ON profiles;
DROP POLICY IF EXISTS "Allow admin to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin to delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to insert profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to delete profile" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow passengers to read driver profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow drivers to read all passenger and driver profiles" ON profiles;
DROP POLICY IF EXISTS "Allow passengers to read driver profiles for their rides" ON profiles;
DROP POLICY IF EXISTS "Allow admin to manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile." ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile." ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile." ON profiles;
DROP POLICY IF EXISTS "Allow drivers to read all passenger and driver profiles." ON profiles;
DROP POLICY IF EXISTS "Allow passengers to read driver profiles for their rides." ON profiles;
DROP POLICY IF EXISTS "Allow admin to manage all profiles." ON profiles;

-- Drop existing RLS policies for rides
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin on rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to manage their accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to read pending rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to manage their own rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to read accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to insert new rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update their location" ON rides;
DROP POLICY IF EXISTS "Allow drivers to read all rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to create rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to accept pending rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to complete accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to cancel pending/accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to cancel accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow admin full access to rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to read all pending rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to update their own pending/accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to delete their own pending rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to read pending rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update their location" ON rides;
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to update their own pending/accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to delete their own pending rides" ON rides;
DROP POLICY IF EXISTS "Allow admin to manage all rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to read all pending rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow drivers to update their location" ON rides;
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to update their own pending/accepted rides" ON rides;
DROP POLICY IF EXISTS "Allow passengers to delete their own pending rides" ON rides;
DROP POLICY IF EXISTS "Allow admin to manage all rides" ON rides;

-- Drop existing RLS policies for ratings
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin on ratings" ON ratings;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON ratings;
DROP POLICY IF EXISTS "Allow users to read ratings for their rides" ON ratings;
DROP POLICY IF EXISTS "Allow admin full access to ratings" ON ratings;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings." ON ratings;
DROP POLICY IF EXISTS "Allow users to read ratings for their rides." ON ratings;

-- Drop existing RLS policies for messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin on messages" ON messages;
DROP POLICY IF EXISTS "Allow participants to read messages" ON messages;
DROP POLICY IF EXISTS "Allow participants to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow admin full access to messages" ON messages;
DROP POLICY IF EXISTS "Allow participants to read messages." ON messages;
DROP POLICY IF EXISTS "Allow participants to insert messages." ON messages;

-- Drop existing RLS policies for user_settings
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin on user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow users to manage their own settings" ON user_settings;
DROP POLICY IF EXISTS "Allow admin full access to user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow users to manage their own settings." ON user_settings;

-- Drop existing RLS policies for settings
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin to manage settings" ON settings;
DROP POLICY IF EXISTS "Allow public read access to settings" ON settings;
DROP POLICY IF EXISTS "Allow admin to manage settings." ON settings;
DROP POLICY IF EXISTS "Allow public read access to settings." ON settings;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_type_from_jwt();
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop tables if they exist
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS public.locations; -- If you had a separate locations table

-- Recreate tables

-- profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text UNIQUE NOT NULL,
  user_type text DEFAULT 'passenger'::text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  phone_number text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- rides table
CREATE TABLE public.rides (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  passenger_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_location text NOT NULL,
  destination text NOT NULL,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  passengers_count integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  driver_current_lat double precision,
  driver_current_lng double precision,
  cancellation_reason text
);
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

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
  sender_id uuid REFERENCES public.public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- user_settings table
CREATE TABLE public.user_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme text DEFAULT 'system'::text NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL,
  language text DEFAULT 'ar'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- settings table (for global app settings managed by admin)
CREATE TABLE public.settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create functions and triggers

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, status, phone_number, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'active'),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user type from JWT (for RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_type_from_jwt()
RETURNS text AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::json->>'user_type', 'anonymous');
$$ LANGUAGE sql STABLE;

-- Function to check if user is admin (for RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.get_user_type_from_jwt() = 'admin';
$$ LANGUAGE sql STABLE;

-- RLS Policies for profiles table
CREATE POLICY "Allow authenticated users to read their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to delete their own profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow drivers to read all passenger and driver profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_type_from_jwt() = 'driver' AND user_type IN ('passenger', 'driver')
  );

CREATE POLICY "Allow passengers to read driver profiles for their rides" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_type_from_jwt() = 'passenger' AND user_type = 'driver' AND
    EXISTS (SELECT 1 FROM public.rides WHERE (rides.passenger_id = auth.uid() AND rides.driver_id = profiles.id))
  );

CREATE POLICY "Allow admin to manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for rides table
CREATE POLICY "Allow passengers to insert rides" ON public.rides
  FOR INSERT TO authenticated
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Allow passengers to read their own rides" ON public.rides
  FOR SELECT TO authenticated
  USING (passenger_id = auth.uid());

CREATE POLICY "Allow passengers to update their own pending/accepted rides" ON public.rides
  FOR UPDATE TO authenticated
  USING (passenger_id = auth.uid() AND status IN ('pending', 'accepted'))
  WITH CHECK (passenger_id = auth.uid() AND status IN ('pending', 'accepted'));

CREATE POLICY "Allow passengers to delete their own pending rides" ON public.rides
  FOR DELETE TO authenticated
  USING (passenger_id = auth.uid() AND status = 'pending');

CREATE POLICY "Allow drivers to read pending rides" ON public.rides
  FOR SELECT TO authenticated
  USING (public.get_user_type_from_jwt() = 'driver' AND status = 'pending' AND driver_id IS NULL);

CREATE POLICY "Allow drivers to update accepted rides" ON public.rides
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid() AND status IN ('accepted', 'pending')) -- Driver can accept a pending ride
  WITH CHECK (driver_id = auth.uid() AND status IN ('accepted', 'completed', 'cancelled')); -- Driver can only set status to accepted, completed, cancelled

CREATE POLICY "Allow drivers to update their location" ON public.rides
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Allow admin to manage all rides" ON public.rides
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for ratings table
CREATE POLICY "Allow authenticated users to insert ratings" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Allow users to read ratings for their rides" ON public.ratings
  FOR SELECT TO authenticated
  USING (rater_id = auth.uid() OR rated_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_id AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())));

CREATE POLICY "Allow admin full access to ratings" ON public.ratings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for messages table
CREATE POLICY "Allow participants to read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_id AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid()))
  );

CREATE POLICY "Allow participants to insert messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_id AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid()))
  );

CREATE POLICY "Allow admin full access to messages" ON public.messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for user_settings table
CREATE POLICY "Allow users to manage their own settings" ON public.user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admin full access to user_settings" ON public.user_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for settings table
CREATE POLICY "Allow public read access to settings" ON public.settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to manage settings" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage RLS Policies for 'avatars' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to update their own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public read access to avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Insert default settings (only if table is empty)
INSERT INTO public.settings (key, value, description) VALUES
('allow_new_registrations', 'true', 'Whether new users can register for the app.'),
('driver_auto_approve', 'false', 'Automatically approve new driver registrations.'),
('default_currency', 'SAR', 'The default currency used in the app.'),
('default_map_zoom', '12', 'Default zoom level for maps.'),
('default_map_center_lat', '31.9539', 'Default map center latitude.'),
('default_map_center_lng', '35.9106', 'Default map center longitude.')
ON CONFLICT (key) DO NOTHING;