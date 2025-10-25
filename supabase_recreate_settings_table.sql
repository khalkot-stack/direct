BEGIN; -- Start a transaction for atomic execution

-- Drop existing settings table if it exists
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create settings table with required columns
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Use UUID for consistency with other tables
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  commission_rate numeric(5, 2) NOT NULL DEFAULT 10.00, -- Example: 10.00%
  notifications_enabled boolean NOT NULL DEFAULT TRUE
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view and update settings
CREATE POLICY "Admins can view settings."
  ON public.settings FOR SELECT
  USING (get_user_type() = 'admin');

CREATE POLICY "Admins can update settings."
  ON public.settings FOR UPDATE
  USING (get_user_type() = 'admin')
  WITH CHECK (get_user_type() = 'admin');

-- Policy: Admins can insert settings (if none exist, for initial setup)
CREATE POLICY "Admins can insert settings."
  ON public.settings FOR INSERT
  WITH CHECK (get_user_type() = 'admin');

COMMIT; -- End the transaction