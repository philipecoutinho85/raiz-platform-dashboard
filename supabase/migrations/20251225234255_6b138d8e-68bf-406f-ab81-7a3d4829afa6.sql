-- Table to track creator consent to platform rules
CREATE TABLE public.creator_consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  consent_text TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_consent_records ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own consent records
CREATE POLICY "Users can view their own consent records"
ON public.creator_consent_records
FOR SELECT
USING (auth.uid() = user_id);

-- Policies: Users can insert their own consent records  
CREATE POLICY "Users can insert their own consent records"
ON public.creator_consent_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies: Admins can view all consent records
CREATE POLICY "Admins can view all consent records"
ON public.creator_consent_records
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_creator_consent_user_id ON public.creator_consent_records(user_id);
CREATE INDEX idx_creator_consent_project_id ON public.creator_consent_records(project_id);

-- Add is_identity_verified column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT false;

COMMENT ON TABLE public.creator_consent_records IS 'Tracks creator acceptance of platform rules for administrative proof';