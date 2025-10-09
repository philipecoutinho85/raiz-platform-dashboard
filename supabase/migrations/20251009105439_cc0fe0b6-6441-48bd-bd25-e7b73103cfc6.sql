-- Add moderator to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage moderator permissions" ON public.moderator_permissions;
DROP POLICY IF EXISTS "Moderators can view own permissions" ON public.moderator_permissions;

-- Create system settings table for maintenance mode and analytics
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção. Voltaremos em breve."}'::jsonb),
  ('analytics', '{"google_analytics_id": "", "google_tag_manager_id": "", "meta_pixel_id": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create moderator permissions table
CREATE TABLE IF NOT EXISTS public.moderator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  can_review_projects boolean DEFAULT true,
  can_manage_users boolean DEFAULT false,
  can_view_analytics boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage moderator permissions
CREATE POLICY "Admins can manage moderator permissions"
ON public.moderator_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view their own permissions
CREATE POLICY "Moderators can view own permissions"
ON public.moderator_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_moderator_permissions_user_id ON public.moderator_permissions(user_id);