-- Create a function to create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name text;
  _phone_number text;
  _user_type text;
BEGIN
  -- Attempt to get full_name, phone_number, and user_type from new.raw_user_meta_data
  -- Coalesce with NULL if the key doesn't exist or is null
  _full_name := NEW.raw_user_meta_data->>'full_name';
  _phone_number := NEW.raw_user_meta_data->>'phone_number';
  _user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'); -- Default to 'passenger'

  INSERT INTO public.profiles (id, full_name, email, phone_number, user_type)
  VALUES (NEW.id, _full_name, NEW.email, _phone_number, _user_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();