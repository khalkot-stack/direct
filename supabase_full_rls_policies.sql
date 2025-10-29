-- Enable RLS on all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

DROP POLICY IF EXISTS "Passengers can create rides" ON rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view pending rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view and update their accepted rides" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;
DROP POLICY IF EXISTS "Admins can update all rides" ON rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON rides;
DROP POLICY IF EXISTS "Admins can delete rides" ON rides;
DROP POLICY IF EXISTS "Passengers can cancel their pending/accepted rides" ON rides;
DROP POLICY IF EXISTS "Drivers can cancel their accepted rides" ON rides;
DROP POLICY IF EXISTS "Passengers can delete their completed/cancelled rides" ON rides;
DROP POLICY IF EXISTS "Drivers can delete their completed/cancelled rides" ON rides;


DROP POLICY IF EXISTS "Users can create ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view ratings for rides they participated in" ON ratings;
DROP POLICY IF EXISTS "Admins can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can update all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can insert ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can delete ratings" ON ratings;

DROP POLICY IF EXISTS "Users can send messages in their rides" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their rides" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "All authenticated users can read settings" ON settings;


-- Helper function to get user role from auth.users metadata
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid());
END;
$function$;

-- Helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role() = 'admin');
END;
$function$;

-- Helper function for driver check
CREATE OR REPLACE FUNCTION public.is_driver()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role() = 'driver');
END;
$function$;

-- Helper function for passenger check
CREATE OR REPLACE FUNCTION public.is_passenger()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role() = 'passenger');
END;
$function$;


--
-- profiles table RLS policies
--

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated USING (public.is_admin());

-- Allow admins to insert profiles (e.g., for new user creation via admin panel)
CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
FOR DELETE TO authenticated USING (public.is_admin());


--
-- rides table RLS policies
--

-- Passengers can create new rides
CREATE POLICY "Passengers can create rides" ON rides
FOR INSERT TO authenticated WITH CHECK (public.is_passenger() AND auth.uid() = passenger_id);

-- Passengers can view their own rides
CREATE POLICY "Passengers can view their own rides" ON rides
FOR SELECT TO authenticated USING (public.is_passenger() AND auth.uid() = passenger_id);

-- Drivers can view pending rides (not assigned to any driver yet)
CREATE POLICY "Drivers can view pending rides" ON rides
FOR SELECT TO authenticated USING (public.is_driver() AND status = 'pending' AND driver_id IS NULL);

-- Drivers can view and update rides assigned to them
CREATE POLICY "Drivers can view and update their accepted rides" ON rides
FOR ALL TO authenticated USING (public.is_driver() AND auth.uid() = driver_id);

-- Passengers can cancel their pending or accepted rides
CREATE POLICY "Passengers can cancel their pending/accepted rides" ON rides
FOR UPDATE TO authenticated
USING (public.is_passenger() AND auth.uid() = passenger_id AND status IN ('pending', 'accepted'))
WITH CHECK (public.is_passenger() AND auth.uid() = passenger_id AND status IN ('pending', 'accepted', 'cancelled'));

-- Drivers can cancel their accepted rides
CREATE POLICY "Drivers can cancel their accepted rides" ON rides
FOR UPDATE TO authenticated
USING (public.is_driver() AND auth.uid() = driver_id AND status = 'accepted')
WITH CHECK (public.is_driver() AND auth.uid() = driver_id AND status IN ('accepted', 'cancelled'));

-- Passengers can delete their completed or cancelled rides
CREATE POLICY "Passengers can delete their completed/cancelled rides" ON rides
FOR DELETE TO authenticated USING (public.is_passenger() AND auth.uid() = passenger_id AND status IN ('completed', 'cancelled'));

-- Drivers can delete their completed or cancelled rides
CREATE POLICY "Drivers can delete their completed/cancelled rides" ON rides
FOR DELETE TO authenticated USING (public.is_driver() AND auth.uid() = driver_id AND status IN ('completed', 'cancelled'));

-- Admins can view, insert, update, and delete all rides
CREATE POLICY "Admins can manage all rides" ON rides
FOR ALL TO authenticated USING (public.is_admin());


--
-- ratings table RLS policies
--

-- Users can create ratings (only if they are passenger and the ride is completed, or driver and ride is completed)
CREATE POLICY "Users can create ratings" ON ratings
FOR INSERT TO authenticated WITH CHECK (
  (public.is_passenger() AND auth.uid() = rater_id AND EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND passenger_id = auth.uid() AND status = 'completed')) OR
  (public.is_driver() AND auth.uid() = rater_id AND EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND driver_id = auth.uid() AND status = 'completed'))
);

-- Users can view ratings they made
CREATE POLICY "Users can view their own ratings" ON ratings
FOR SELECT TO authenticated USING (auth.uid() = rater_id);

-- Users can view ratings for rides they participated in (e.g., passenger viewing driver's rating for their ride)
CREATE POLICY "Users can view ratings for rides they participated in" ON ratings
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid()))
);

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings" ON ratings
FOR ALL TO authenticated USING (public.is_admin());


--
-- messages table RLS policies
--

-- Users can send messages in rides they are part of
CREATE POLICY "Users can send messages in their rides" ON messages
FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid())))
);

-- Users can view messages in rides they are part of
CREATE POLICY "Users can view messages in their rides" ON messages
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM rides WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid()))
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages" ON messages
FOR ALL TO authenticated USING (public.is_admin());


--
-- notifications table RLS policies
--

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can insert notifications (e.g., system notifications)
CREATE POLICY "Admins can insert notifications" ON notifications
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can update all notifications
CREATE POLICY "Admins can update all notifications" ON notifications
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
FOR DELETE TO authenticated USING (public.is_admin());


--
-- settings table RLS policies
--

-- Admins can manage (insert, select, update, delete) settings
CREATE POLICY "Admins can manage settings" ON settings
FOR ALL TO authenticated USING (public.is_admin());

-- All authenticated users can read settings (e.g., commission rate for display)
CREATE POLICY "All authenticated users can read settings" ON settings
FOR SELECT TO authenticated USING (true);