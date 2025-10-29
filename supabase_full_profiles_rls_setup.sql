-- 1. Enable Row Level Security for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing RLS policies on the profiles table to prevent conflicts
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow drivers to view passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow passengers to view driver profiles for their accepted rides" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;


-- 3. Add new RLS policies

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

-- Policy for DELETE: Authenticated users can delete their own profile (optional, but good for completeness)
CREATE POLICY "Authenticated users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated USING (
  (auth.uid() = id)
);

-- Policy for Admin users to manage all profiles (assuming 'admin' user_type in profiles table)
-- This policy should be added if you have an admin role and want them to bypass other RLS.
-- You would need a function like is_admin() or check user_metadata directly.
-- For simplicity, let's assume a function `is_admin()` exists or you'll add it later.
-- If not, this policy might also cause issues if `is_admin()` is not defined or causes recursion.
-- For now, I'll comment it out to focus on the core self-profile access.
/*
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_type')::text = 'admin'
);
*/