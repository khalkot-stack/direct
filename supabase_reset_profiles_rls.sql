-- 1. Disable Row Level Security for the profiles table temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing RLS policies on the profiles table
-- This is a more aggressive approach to ensure no old, conflicting policies are lingering.
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow drivers to view passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow passengers to view driver profiles for their accepted rides" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
-- If you have any other custom policy names on 'profiles', add them here to be dropped.

-- 3. Re-enable Row Level Security for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Add the most basic and essential RLS policies for authenticated users to manage their own profile

-- Policy for SELECT: Authenticated users can view their own profile
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated USING (
  (auth.uid() = id)
);

-- Policy for INSERT: Authenticated users can create their own profile
CREATE POLICY "Authenticated users can create their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = id)
);

-- Policy for UPDATE: Authenticated users can update their own profile
CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (
  (auth.uid() = id)
) WITH CHECK (
  (auth.uid() = id)
);

-- Policy for DELETE: Authenticated users can delete their own profile
CREATE POLICY "Authenticated users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated USING (
  (auth.uid() = id)
);