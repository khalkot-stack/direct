-- Drop all existing RLS policies on the profiles table
DROP POLICY IF EXISTS "Allow self-read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Drivers can read passenger profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Passengers can read driver profiles for their rides" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-insert access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-profile view" ON public.profiles;
DROP POLICY IF EXISTS "Allow driver to view passenger profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow passenger to view driver profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles; -- Policy name from error
DROP POLICY IF EXISTS "Allow drivers to view passenger profiles for their rides" ON public.profiles; -- Policy name from error
DROP POLICY IF EXISTS "Allow passengers to view driver profiles for their accepted rid" ON public.profiles; -- Policy name from error

-- Drop all existing RLS policies on the rides table
DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to read rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to update rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Admins can manage all rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can read all rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can update rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can delete rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to cancel their pending/accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to delete completed rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to delete completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view pending rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can accept pending rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view and update their accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can delete their completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can delete their completed/cancelled rides" ON public.rides; -- Policy name from error

-- Drop all existing RLS policies on the settings table
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin to manage settings" ON public.settings;

-- Drop all existing RLS policies on the ratings table
DROP POLICY IF EXISTS "Allow authenticated users to view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own ratings" ON public.ratings;

-- Drop all existing RLS policies on the messages table
DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own messages" ON public.messages;


-- Drop the problematic get_user_type function with CASCADE
DROP FUNCTION IF EXISTS public.get_user_type(uuid) CASCADE;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- RLS Policies for public.profiles (Simplified SELECT policies to avoid recursion)
--

-- Allow users to read their own profile
CREATE POLICY "Allow self-read access to profiles" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile on signup
CREATE POLICY "Allow self-insert access to profiles" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to insert profiles (inlining the role check)
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow users to update their own profile
CREATE POLICY "Allow self-update access to profiles" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update all profiles (inlining the role check)
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow admins to delete profiles (inlining the role check)
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- IMPORTANT: The "Admins can read all profiles" policy for SELECT is intentionally OMITTED from here.
-- Admin SELECT access to profiles will be handled by the get_all_profiles_for_admin function.
-- The policies for drivers/passengers to read *other* profiles are also removed from here.
-- Instead, when a driver/passenger needs to see another user's profile (e.g., on a ride details page),
-- the query should join `rides` and rely on the RLS of `rides` to filter which `profiles` can be seen.

--
-- RLS Policies for public.rides
--

-- Allow passengers to read their own rides
CREATE POLICY "Allow passengers to read their own rides" ON public.rides
FOR SELECT USING (passenger_id = auth.uid());

-- Allow drivers to read rides assigned to them
CREATE POLICY "Allow drivers to read rides assigned to them" ON public.rides
FOR SELECT USING (driver_id = auth.uid());

-- Allow admins to read all rides (inlining the role check)
CREATE POLICY "Admins can read all rides" ON public.rides
FOR SELECT USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow passengers to insert new rides
CREATE POLICY "Allow passengers to insert rides" ON public.rides
FOR INSERT WITH CHECK (passenger_id = auth.uid());

-- Allow admins to insert rides (inlining the role check)
CREATE POLICY "Admins can insert rides" ON public.rides
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow drivers to update rides assigned to them (e.g., accept, complete)
CREATE POLICY "Allow drivers to update rides assigned to them" ON public.rides
FOR UPDATE USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid()); -- Ensure driver_id doesn't change

-- Allow passengers to cancel their pending/accepted rides
CREATE POLICY "Allow passengers to cancel their pending/accepted rides" ON public.rides
FOR UPDATE USING (passenger_id = auth.uid() AND status IN ('pending', 'accepted'))
WITH CHECK (passenger_id = auth.uid() AND status = 'cancelled'); -- Only allow status change to 'cancelled'

-- Allow admins to update all rides (inlining the role check)
CREATE POLICY "Admins can update rides" ON public.rides
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow drivers to delete their completed rides
CREATE POLICY "Allow drivers to delete completed rides" ON public.rides
FOR DELETE USING (driver_id = auth.uid() AND status = 'completed');

-- Allow passengers to delete their completed or cancelled rides
CREATE POLICY "Allow passengers to delete completed/cancelled rides" ON public.rides
FOR DELETE USING (passenger_id = auth.uid() AND status IN ('completed', 'cancelled'));

-- Allow admins to delete all rides (inlining the role check)
CREATE POLICY "Admins can delete rides" ON public.rides
FOR DELETE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

--
-- RLS Policies for public.settings
--

-- Allow admins to view settings
CREATE POLICY "Admins can view settings" ON public.settings
FOR SELECT USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow admins to insert settings
CREATE POLICY "Admins can insert settings" ON public.settings
FOR INSERT WITH CHECK ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Allow admins to update settings
CREATE POLICY "Admins can update settings" ON public.settings
FOR UPDATE USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

--
-- RLS Policies for public.ratings
--

-- Allow authenticated users to view ratings
CREATE POLICY "Allow authenticated users to view ratings" ON public.ratings
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert ratings
CREATE POLICY "Allow authenticated users to insert ratings" ON public.ratings
FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Allow authenticated users to update their own ratings
CREATE POLICY "Allow authenticated users to update their own ratings" ON public.ratings
FOR UPDATE USING (rater_id = auth.uid());

-- Allow authenticated users to delete their own ratings
CREATE POLICY "Allow authenticated users to delete their own ratings" ON public.ratings
FOR DELETE USING (rater_id = auth.uid());

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings" ON public.ratings
FOR ALL USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');

--
-- RLS Policies for public.messages
--

-- Allow authenticated users to view messages
CREATE POLICY "Allow authenticated users to view messages" ON public.messages
FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Allow authenticated users to insert messages
CREATE POLICY "Allow authenticated users to insert messages" ON public.messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Allow authenticated users to update their own messages
CREATE POLICY "Allow authenticated users to update their own messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- Allow authenticated users to delete their own messages
CREATE POLICY "Allow authenticated users to delete their own messages" ON public.messages
FOR DELETE USING (sender_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING ((SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin');