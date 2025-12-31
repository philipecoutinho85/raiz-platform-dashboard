-- Add fields to track chat status for rejection messages
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS rejection_chat_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS rejection_chat_closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_chat_closed_by uuid;

-- Add comment for clarity
COMMENT ON COLUMN public.projects.rejection_chat_active IS 'Whether the rejection chat is still active';
COMMENT ON COLUMN public.projects.rejection_chat_closed_at IS 'When the rejection chat was closed';
COMMENT ON COLUMN public.projects.rejection_chat_closed_by IS 'Admin who closed the rejection chat';