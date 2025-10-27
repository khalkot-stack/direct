-- Drop the existing profiles table if it exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create the profiles table
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
-- Policy for authenticated users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy for authenticated users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

-- Policy for admins to insert new profiles (e.g., for new users or manual creation)
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.is_admin());

-- Policy for admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (public.is_admin());

-- Policy for admins to delete any profile
CREATE POLICY "Admins can delete any profile" ON public.profiles
FOR DELETE USING (public.is_admin());

-- Create an index on user_type for faster lookups
CREATE INDEX profiles_user_type_idx ON public.profiles (user_type);

-- Create an index on email for faster lookups
CREATE INDEX profiles_email_idx ON public.profiles (email);

-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();