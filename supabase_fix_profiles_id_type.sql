-- 1. Drop any existing foreign key constraints that might be referencing public.profiles.id
--    (This is necessary to change the type of the 'id' column. You might need to find the exact constraint names from your Supabase dashboard -> Database -> Table Editor -> profiles -> Foreign Keys)
--    Example: ALTER TABLE public.some_other_table DROP CONSTRAINT IF EXISTS some_other_table_profile_id_fkey;
--    For the 'rides' table, we haven't created the FK yet, so no need to drop it there.

-- 2. Drop the primary key constraint on profiles.id to allow type alteration
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- 3. Alter the type of the 'id' column in the 'profiles' table to UUID
--    WARNING: If your 'profiles' table already contains data with bigint IDs,
--    this step will likely fail if the bigint values cannot be directly cast to valid UUIDs.
--    If it fails, you might need to:
--    a. TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE; (DANGER: This will DELETE ALL DATA in your profiles table!)
--    b. Then re-run this ALTER COLUMN command.
ALTER TABLE public.profiles
ALTER COLUMN id TYPE uuid USING id::text::uuid;

-- 4. Re-add the primary key constraint and link to auth.users.id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Ensure RLS is enabled for profiles table (good practice)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Add basic RLS policies for profiles table (if not already present)
--    Users can view and update their own profile
CREATE POLICY "Users can view and update their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

--    Admins can view all profiles (assuming get_user_type() is defined later)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (((auth.jwt() -> 'user_metadata')::jsonb) ->> 'user_type' = 'admin');

--    Admins can manage all profiles (assuming get_user_type() is defined later)
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (((auth.jwt() -> 'user_metadata')::jsonb) ->> 'user_type' = 'admin')
WITH CHECK (((auth.jwt() -> 'user_metadata')::jsonb) ->> 'user_type' = 'admin');