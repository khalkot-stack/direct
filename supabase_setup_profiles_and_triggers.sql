BEGIN; -- Start a transaction for atomic execution

-- 1. Create user_type ENUM
DO $$ BEGIN
  CREATE TYPE public.user_type AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop existing get_user_type function if it exists (to allow changing return type)
DROP FUNCTION IF EXISTS public.get_user_type() CASCADE;

-- 3. Create get_user_type function (for RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS public.user_type AS $$
  SELECT ((current_setting('request.jwt.claims', true)::jsonb)->'user_metadata'->>'user_type')::public.user_type;
$$ LANGUAGE sql STABLE;

-- 4. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- 5. Drop existing profiles table if it exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 6. Create profiles table with RLS policies
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  user_type public.user_type DEFAULT 'passenger'::public.user_type,
  phone_number text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles."
  ON public.profiles FOR ALL
  USING (get_user_type() = 'admin')
  WITH CHECK (get_user_type() = 'admin');

-- 7. Create handle_new_user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _user_type public.user_type;
BEGIN
  -- Safely determine user_type, defaulting to 'passenger'
  SELECT COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger') INTO _user_type;

  INSERT INTO public.profiles (id, full_name, email, user_type, phone_number, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    _user_type,
    NEW.raw_user_meta_data->>'phone_number',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT; -- End the transaction