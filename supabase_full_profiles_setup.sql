-- 1. Create the profiles table if it doesn't exist, or alter it to ensure all columns are present
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text, -- Added email column to profiles table
  username text UNIQUE,
  avatar_url text,
  website text,
  user_type text DEFAULT 'passenger'::text NOT NULL,
  car_model text,
  car_color text,
  license_plate text,
  phone_number text,
  status text DEFAULT 'active'::text NOT NULL,
  updated_at timestamp with time zone
);

-- 2. Enable Row Level Security for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create a function to set the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.set_current_timestamp_on_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to call set_current_timestamp_on_updated_at on profiles update
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_on_updated_at();

-- 5. Create a function to create a profile for new users in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email, -- Get email directly from NEW.email
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'), -- Default to 'passenger'
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'status', 'active') -- Default to 'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a trigger to call handle_new_user() on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Re-create the get_user_type function (from previous step, ensuring it's up-to-date)
CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  u_type text;
BEGIN
  SELECT user_type INTO u_type FROM public.profiles WHERE id = user_id;
  RETURN u_type;
END;
$function$;

-- 8. Re-create RLS policies for profiles and rides (from previous step, ensuring they're up-to-date)
-- Policy for profiles table: Allow admins to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (get_user_type(auth.uid()) = 'admin')
WITH CHECK (get_user_type(auth.uid()) = 'admin');

-- Policy for rides table: Allow admins to manage all rides
DROP POLICY IF EXISTS "Admins can manage all rides" ON public.rides;
CREATE POLICY "Admins can manage all rides"
ON public.rides FOR ALL TO authenticated
USING (get_user_type(auth.uid()) = 'admin')
WITH CHECK (get_user_type(auth.uid()) = 'admin');

-- Re-create existing policies to ensure they are ordered correctly and don't conflict
-- Policy for profiles table
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to view their own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy for rides table
DROP POLICY IF EXISTS "Allow passengers to create rides" ON public.rides;
CREATE POLICY "Allow passengers to create rides"
ON public.rides FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Allow passengers to view their own rides" ON public.rides;
CREATE POLICY "Allow passengers to view their own rides"
ON public.rides FOR SELECT TO authenticated USING (auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Allow passengers to update their own rides" ON public.rides;
CREATE POLICY "Allow passengers to update their own rides"
ON public.rides FOR UPDATE TO authenticated USING (auth.uid() = passenger_id) WITH CHECK (auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Allow drivers to view accepted rides" ON public.rides;
CREATE POLICY "Allow drivers to view accepted rides"
ON public.rides FOR SELECT TO authenticated USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Allow drivers to update accepted rides" ON public.rides;
CREATE POLICY "Allow drivers to update accepted rides"
ON public.rides FOR UPDATE TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);