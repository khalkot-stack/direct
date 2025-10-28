-- إنشاء دالة لاستخراج نوع المستخدم من JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- مهم لتنفيذ الدالة بصلاحيات مرتفعة داخل RLS
AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'user_type');
END;
$$;

-- منح صلاحيات التنفيذ للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;