-- حذف جميع سياسات RLS الموجودة على جدول public.rides
DROP POLICY IF EXISTS "Admins can delete any ride" ON public.rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Admins can update any ride" ON public.rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can accept pending rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can complete accepted rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view relevant rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can insert rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can update their pending rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON public.rides;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rides; -- إذا كان هناك سياسة عامة سابقة
DROP POLICY IF EXISTS "Allow drivers to update ride status" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow passengers to create rides" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow passengers to view their rides" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow drivers to view pending rides" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow drivers to view accepted rides" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow passengers to cancel their rides" ON public.rides; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow drivers to update their accepted rides" ON public.rides; -- إذا كان هناك سياسة سابقة


-- حذف جميع سياسات RLS الموجودة على جدول public.ratings
DROP POLICY IF EXISTS "Admins can delete any rating" ON public.ratings;
DROP POLICY IF EXISTS "Allow all authenticated users to read ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to create ratings" ON public.ratings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ratings; -- إذا كان هناك سياسة عامة سابقة
DROP POLICY IF EXISTS "Allow users to insert ratings" ON public.ratings; -- إذا كان هناك سياسة سابقة
DROP POLICY IF EXISTS "Allow users to update their ratings" ON public.ratings; -- إذا كان هناك سياسة سابقة