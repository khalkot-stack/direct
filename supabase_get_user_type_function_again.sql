CREATE OR REPLACE FUNCTION get_user_type()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN ((auth.jwt() -> 'user_metadata')::jsonb) ->> 'user_type';
END;
$$;