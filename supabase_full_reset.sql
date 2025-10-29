-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables (with CASCADE to handle foreign key dependencies and RLS policies)
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