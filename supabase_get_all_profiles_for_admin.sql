CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure only authenticated admins can call this function
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'user_type' = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Only administrators can view all profiles.';
  END IF;

  RETURN QUERY SELECT * FROM public.profiles;
END;
$$;