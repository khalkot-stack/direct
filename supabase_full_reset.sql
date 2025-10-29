-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop RLS policies (if they exist)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles." ON public.profiles;

DROP POLICY IF EXISTS "Passengers can view their own rides." ON public.rides;
DROP POLICY IF EXISTS "Drivers can view their accepted/completed rides." ON public.rides;
DROP POLICY IF EXISTS "Drivers can view pending rides." ON public.rides;
DROP POLICY IF EXISTS "Passengers can request a ride." ON public.rides;
DROP POLICY IF EXISTS "Drivers can accept pending rides." ON public.rides;
DROP POLICY IF EXISTS "Drivers can update status of their accepted rides." ON public.rides;
DROP POLICY IF EXISTS "Passengers can cancel their pending/accepted rides." ON public.rides;
DROP POLICY IF EXISTS "Passengers can delete their completed/cancelled rides." ON public.rides;
DROP POLICY IF EXISTS "Drivers can delete their completed/cancelled rides." ON public.rides;
DROP POLICY IF EXISTS "Admins can manage all rides." ON public.rides;

DROP POLICY IF EXISTS "All authenticated users can view ratings." ON public.ratings;
DROP POLICY IF EXISTS "Passengers can insert ratings for completed rides." ON public.ratings;
DROP POLICY IF EXISTS "Admins can manage ratings." ON public.ratings;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can mark their own notifications as read." ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications." ON public.notifications;

DROP POLICY IF EXISTS "Ride participants can view messages." ON public.messages;
DROP POLICY IF EXISTS "Ride participants can send messages." ON public.messages;
DROP POLICY IF EXISTS "Admins can delete messages." ON public.messages;

DROP POLICY IF EXISTS "All authenticated users can view settings." ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;

DROP POLICY IF EXISTS "Avatar images are publicly readable." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

-- Drop tables (with CASCADE to handle foreign key dependencies)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_type();
DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin();

-- Drop ENUM types
DROP TYPE IF EXISTS public.user_type_enum CASCADE;
DROP TYPE IF EXISTS public.profile_status_enum CASCADE;
DROP TYPE IF EXISTS public.ride_status_enum CASCADE;

-- Optionally, revoke permissions if needed (less critical for a full reset)
REVOKE ALL ON SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;