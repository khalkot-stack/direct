-- Drop the trigger first, as it depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_type() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;