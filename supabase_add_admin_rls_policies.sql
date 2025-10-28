-- Ensure RLS is enabled for profiles and rides tables (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

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