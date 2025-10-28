CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER -- هذا يسمح للدالة بتجاوز RLS عند قراءة جدول profiles
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT user_type INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role;
END;
$function$;

-- التأكد من أن المستخدمين المصادق عليهم لديهم إذن تنفيذ الدالة
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;