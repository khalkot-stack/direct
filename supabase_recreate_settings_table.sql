-- WARNING: This script will DELETE ALL DATA in your 'settings' table.
-- Only run this if you are in a development environment and can afford to lose existing settings data.

-- 1. Drop the existing 'settings' table
DROP TABLE IF EXISTS public.settings CASCADE;

-- 2. Recreate the 'settings' table with 'id' as UUID primary key and created_at
CREATE TABLE public.settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_rate numeric NOT NULL DEFAULT 10.0,
    notifications_enabled boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Enable Row Level Security for the 'settings' table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS policy for the 'settings' table (Admins can manage settings)
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
USING (get_user_type() = 'admin')
WITH CHECK (get_user_type() = 'admin');

-- 5. Add RLS policy for the 'settings' table (All authenticated users can view settings)
CREATE POLICY "All authenticated users can view settings"
ON public.settings
FOR SELECT
USING (auth.role() = 'authenticated');