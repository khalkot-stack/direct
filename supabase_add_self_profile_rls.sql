-- Enable Row Level Security for the profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts or needs to be replaced
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;

-- Create a new RLS policy to allow authenticated users to view their own profile
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated USING (
  (auth.uid() = id)
);