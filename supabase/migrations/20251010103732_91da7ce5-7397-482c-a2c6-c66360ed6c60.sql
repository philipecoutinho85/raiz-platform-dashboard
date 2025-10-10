-- Ensure RLS is enabled on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop restrictive ALL policy if it exists to avoid blocking public SELECTs
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- Allow anyone (including anon) to read ONLY the maintenance_mode setting
CREATE POLICY "Anyone can view maintenance mode"
ON public.system_settings
FOR SELECT
USING (key = 'maintenance_mode');

-- Allow admins to view all settings
CREATE POLICY "Admins can view all settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert settings
CREATE POLICY "Admins can insert settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update settings
CREATE POLICY "Admins can update settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete settings (if ever needed)
CREATE POLICY "Admins can delete settings"
ON public.system_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure maintenance_mode row exists
INSERT INTO public.system_settings (key, value)
SELECT 'maintenance_mode', '{"enabled": false, "message": ""}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE key = 'maintenance_mode'
);

-- Helpful index for lookups by key
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);