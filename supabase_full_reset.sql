-- Set search path to public
SET search_path = public;

-- Disable RLS on all tables before dropping policies
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies (order doesn't strictly matter here as tables will be dropped)
DROP POLICY IF EXISTS "Allow self-read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-insert access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self-update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow passengers to read their own rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to read rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Admins can read all rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to insert rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to update rides assigned to them" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to cancel their pending/accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can update rides" ON public.rides;
DROP POLICY IF EXISTS "Allow drivers to delete completed rides" ON public.rides;
DROP POLICY IF EXISTS "Allow passengers to delete completed/cancelled rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can delete rides" ON public.rides;

DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

DROP POLICY IF EXISTS "Allow authenticated users to view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own ratings" ON public.ratings;

DROP POLICY IF EXISTS "Allow authenticated users to view messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own messages" ON public.messages;

-- Drop functions (using CASCADE to drop dependent objects like triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_type(uuid) CASCADE; -- Ensure this is dropped if it exists

-- Drop tables (using CASCADE to drop dependent objects like foreign keys)
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Drop types (enums) - now after tables that depend on them
DROP TYPE IF EXISTS public.user_status_enum CASCADE;
DROP TYPE IF EXISTS public.user_type_enum CASCADE;
DROP TYPE IF EXISTS public.ride_status_enum CASCADE;

-- Reset search path
RESET search_path;