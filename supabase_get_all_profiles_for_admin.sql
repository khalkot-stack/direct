CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get the user_type directly from auth.users raw_user_meta_data
  SELECT raw_user_meta_data->>'user_type' INTO current_user_role
  FROM auth.users
  WHERE id = auth.uid();

  IF current_user_role = 'admin' THEN
    -- Temporarily disable RLS for this query only for admins
    SET LOCAL row_level_security.active = false;
    RETURN QUERY SELECT * FROM public.profiles;
  ELSE
    RAISE EXCEPTION 'Access denied: Only admins can call this function.';
  END IF;
END;
$$;