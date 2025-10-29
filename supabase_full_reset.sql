-- Disable RLS for all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to view their own rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to view rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to update status of their assigned rides" ON public.rides;
DROP POLICY IF EXISTS "Allow admins to manage all rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to delete their own completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to delete their own completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow users to view ratings for rides they are involved in" ON public.ratings;
DROP POLICY IF EXISTS "Allow admins to manage all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admins to manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to view messages in their rides" ON public.messages;
DROP POLICY IF EXISTS "Allow admins to manage all messages" ON public.messages;


-- Drop all tables
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.get_user_type CASCADE;
DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;