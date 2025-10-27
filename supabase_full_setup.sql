-- 1. Drop existing triggers, functions, and tables (in reverse dependency order to avoid errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_type() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create Helper Functions and Triggers
-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'user_type' = 'admin';
$$ LANGUAGE sql STABLE;

-- Helper function to get current user's type
CREATE OR REPLACE FUNCTION public.get_user_type() -- Corrected: Removed duplicated 'OR'
RETURNS text AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'user_type';
$$ LANGUAGE sql STABLE;

-- Function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to create a profile for new users and update app_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name text;
  _phone_number text;
  _user_type text;
BEGIN
  -- Attempt to get full_name, phone_number, and user_type from new.raw_user_meta_data
  -- Coalesce with NULL if the key doesn't exist or is null
  _full_name := NEW.raw_user_meta_data->>'full_name';
  _phone_number := NEW.raw_user_meta_data->>'phone_number';
  _user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'); -- Default to 'passenger'

  INSERT INTO public.profiles (id, full_name, email, phone_number, user_type)
  VALUES (NEW.id, _full_name, NEW.email, _phone_number, _user_type);

  -- IMPORTANT: Update app_metadata for RLS checks
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('user_type', _user_type)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create profiles table and RLS policies
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    email text UNIQUE,
    phone_number text,
    user_type text CHECK (user_type IN ('passenger', 'driver', 'admin')) NOT NULL DEFAULT 'passenger',
    status text CHECK (status IN ('active', 'suspended', 'banned')) NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (public.is_admin());
-- Create an index on user_type for faster lookups
CREATE INDEX profiles_user_type_idx ON public.profiles (user_type);
-- Create an index on email for faster lookups
CREATE INDEX profiles_email_idx ON public.profiles (email);
-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Create rides table
CREATE TABLE public.rides (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    passenger_id uuid NOT NULL,
    driver_id uuid,
    pickup_location text NOT NULL,
    destination text NOT NULL,
    passengers_count integer NOT NULL DEFAULT 1 CHECK (passengers_count >= 1),
    status text CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Set up Row Level Security (RLS)
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
-- Create an index on passenger_id for faster lookups
CREATE INDEX rides_passenger_id_idx ON public.rides (passenger_id);
-- Create an index on driver_id for faster lookups
CREATE INDEX rides_driver_id_idx ON public.rides (driver_id);
-- Create an index on status for faster lookups
CREATE INDEX rides_status_idx ON public.rides (status);
-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Add foreign keys and RLS policies for rides table
ALTER TABLE public.rides ADD CONSTRAINT rides_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.rides ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
-- Create RLS policies for rides table
CREATE POLICY "Passengers can view their own rides" ON public.rides FOR SELECT USING (auth.uid() = passenger_id AND public.get_user_type() = 'passenger');
CREATE POLICY "Passengers can insert rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = passenger_id AND public.get_user_type() = 'passenger');
CREATE POLICY "Passengers can update their pending rides" ON public.rides FOR UPDATE USING (auth.uid() = passenger_id AND status = 'pending' AND public.get_user_type() = 'passenger') WITH CHECK (auth.uid() = passenger_id AND public.get_user_type() = 'passenger');
CREATE POLICY "Drivers can view relevant rides" ON public.rides FOR SELECT USING (public.get_user_type() = 'driver' AND (status = 'pending' OR driver_id = auth.uid()));
CREATE POLICY "Drivers can accept pending rides" ON public.rides FOR UPDATE USING (public.get_user_type() = 'driver' AND status = 'pending' AND driver_id IS NULL) WITH CHECK (driver_id = auth.uid() AND status = 'accepted');
CREATE POLICY "Drivers can complete accepted rides" ON public.rides FOR UPDATE USING (public.get_user_type() = 'driver' AND driver_id = auth.uid() AND status = 'accepted') WITH CHECK (driver_id = auth.uid() AND status = 'completed');
CREATE POLICY "Admins can view all rides" ON public.rides FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert rides" ON public.rides FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update any ride" ON public.rides FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any ride" ON public.rides FOR DELETE USING (public.is_admin());

-- 6. Create settings table and RLS policies
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    commission_rate numeric(5, 2) NOT NULL DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    notifications_enabled boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Set up Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- Create RLS policies
CREATE POLICY "Admins can view settings" ON public.settings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (public.is_admin());
-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- Insert default settings if the table is empty
INSERT INTO public.settings (commission_rate, notifications_enabled) SELECT 10.00, TRUE WHERE NOT EXISTS (SELECT 1 FROM public.settings);