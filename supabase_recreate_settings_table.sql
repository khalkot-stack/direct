-- Drop the existing settings table if it exists
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create the settings table
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    commission_rate numeric(5, 2) NOT NULL DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    notifications_enabled boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can view settings
CREATE POLICY "Admins can view settings" ON public.settings
FOR SELECT USING (public.is_admin());

-- Only admins can insert settings (e.g., initial setup)
CREATE POLICY "Admins can insert settings" ON public.settings
FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON public.settings
FOR UPDATE USING (public.is_admin());

-- Trigger to update `updated_at` column
CREATE OR REPLACE TRIGGER set_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert default settings if the table is empty
INSERT INTO public.settings (commission_rate, notifications_enabled)
SELECT 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.settings);