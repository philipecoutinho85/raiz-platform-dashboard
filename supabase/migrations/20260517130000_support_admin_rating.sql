ALTER TABLE public.support_conversations
ADD COLUMN IF NOT EXISTS admin_rating integer,
ADD COLUMN IF NOT EXISTS admin_rating_comment text,
ADD COLUMN IF NOT EXISTS admin_rated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS admin_rated_by uuid;

ALTER TABLE public.support_conversations
DROP CONSTRAINT IF EXISTS support_conversations_admin_rating_check;

ALTER TABLE public.support_conversations
ADD CONSTRAINT support_conversations_admin_rating_check
CHECK (admin_rating IS NULL OR (admin_rating >= 1 AND admin_rating <= 5));
