-- 1. Enable Row Level Security on the 'rides' table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- 2. Policy for Admins: Full access to all rides
-- المدراء يمكنهم عرض، إضافة، تعديل، وحذف أي رحلة.
CREATE POLICY "Admins can manage all rides"
ON public.rides
FOR ALL
USING (auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin')
WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin');

-- 3. Policy for Passengers: Select their own rides
-- الركاب يمكنهم فقط عرض الرحلات التي طلبوها.
CREATE POLICY "Passengers can view their own rides"
ON public.rides
FOR SELECT
USING (passenger_id = auth.uid());

-- 4. Policy for Passengers: Insert new ride requests
-- الركاب يمكنهم إضافة طلبات رحلات جديدة، ويجب أن يكونوا هم الراكب وأن تكون الحالة 'pending'.
CREATE POLICY "Passengers can create new ride requests"
ON public.rides
FOR INSERT
WITH CHECK (passenger_id = auth.uid() AND status = 'pending');

-- 5. Policy for Passengers: Update their own pending rides (e.g., cancel)
-- الركاب يمكنهم تعديل رحلاتهم المعلقة فقط (مثل تغيير الحالة إلى 'cancelled').
CREATE POLICY "Passengers can update their own pending rides"
ON public.rides
FOR UPDATE
USING (passenger_id = auth.uid() AND status = 'pending')
WITH CHECK (passenger_id = auth.uid() AND status IN ('pending', 'cancelled'));

-- 6. Policy for Passengers: Delete their own pending rides
-- الركاب يمكنهم حذف رحلاتهم المعلقة فقط.
CREATE POLICY "Passengers can delete their own pending rides"
ON public.rides
FOR DELETE
USING (passenger_id = auth.uid() AND status = 'pending');

-- 7. Policy for Drivers: Select all pending rides
-- السائقون يمكنهم عرض جميع الرحلات التي حالتها 'pending' (للبحث عن ركاب).
CREATE POLICY "Drivers can view all pending rides"
ON public.rides
FOR SELECT
USING (status = 'pending' AND auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'driver');

-- 8. Policy for Drivers: Select rides assigned to them
-- السائقون يمكنهم عرض الرحلات التي تم قبولها أو إكمالها من قبلهم.
CREATE POLICY "Drivers can view their accepted/completed rides"
ON public.rides
FOR SELECT
USING (driver_id = auth.uid() AND auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'driver');

-- 9. Policy for Drivers: Update to accept a pending ride
-- السائقون يمكنهم قبول رحلة معلقة (تغيير driver_id و status).
CREATE POLICY "Drivers can accept a pending ride"
ON public.rides
FOR UPDATE
USING (status = 'pending' AND driver_id IS NULL AND auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'driver')
WITH CHECK (driver_id = auth.uid() AND status = 'accepted');

-- 10. Policy for Drivers: Update to complete/cancel their accepted rides
-- السائقون يمكنهم إكمال أو إلغاء الرحلات التي قبلوها بالفعل.
CREATE POLICY "Drivers can complete/cancel their accepted rides"
ON public.rides
FOR UPDATE
USING (driver_id = auth.uid() AND status = 'accepted' AND auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'driver')
WITH CHECK (driver_id = auth.uid() AND status IN ('completed', 'cancelled'));