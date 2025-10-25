-- WARNING: This script will DELETE ALL DATA in your 'profiles' table.
-- Only run this if you are in a development environment and can afford to lose existing profile data.

-- 1. Drop any existing foreign key constraints from other tables that might be referencing public.profiles.id
--    (e.g., from the 'rides' table)
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_passenger_id_fkey;
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_driver_id_fkey;

-- 2. Drop the existing 'profiles' table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Recreate the 'profiles' table with 'id' as UUID and linked to auth.users.id
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text UNIQUE,
    user_type text DEFAULT 'passenger'::text,
    status text DEFAULT 'active'::text,
    phone_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Enable Row Level Security for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies for the 'profiles' table (as provided previously)
--    Users can view and update their own profile
CREATE POLICY "Users can view and update their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

--    Admins can view all profiles (assuming get_user_type() is defined)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (get_user_type() = 'admin');

--    Admins can manage all profiles (assuming get_user_type() is defined)
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (get_user_type() = 'admin')
WITH CHECK (get_user_type() = 'admin');