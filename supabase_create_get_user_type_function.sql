CREATE OR REPLACE FUNCTION public.get_user_type(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  u_type text;
BEGIN
  SELECT user_type INTO u_type FROM public.profiles WHERE id = user_id;
  RETURN u_type;
END;
$function$;