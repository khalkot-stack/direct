CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY INVOKER -- This function runs with the privileges of the calling user
AS $$
BEGIN
  IF public.get_user_type(auth.uid()) = 'admin' THEN
    -- Temporarily disable RLS for this query only for admins
    SET LOCAL row_level_security.active = false;
    RETURN QUERY SELECT * FROM public.profiles;
  ELSE
    RAISE EXCEPTION 'Access denied: Only admins can call this function.';
  END IF;
END;
$$;