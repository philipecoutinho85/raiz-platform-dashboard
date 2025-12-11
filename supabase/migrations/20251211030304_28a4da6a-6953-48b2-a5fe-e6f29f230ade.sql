-- First, drop existing status check constraint
ALTER TABLE public.support_conversations 
DROP CONSTRAINT IF EXISTS support_conversations_status_check;

-- Add new fields to support_conversations table
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ticket_number text,
ADD COLUMN IF NOT EXISTS rating integer,
ADD COLUMN IF NOT EXISTS rating_comment text,
ADD COLUMN IF NOT EXISTS rated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Add check constraint for rating
ALTER TABLE public.support_conversations 
ADD CONSTRAINT support_conversations_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Add new check constraint with all valid status values
ALTER TABLE public.support_conversations 
ADD CONSTRAINT support_conversations_status_check 
CHECK (status IN ('open', 'closed', 'novo', 'em_andamento', 'aguardando_usuario', 'resolvido', 'fechado'));

-- Generate ticket number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  v_ticket text;
  v_year text;
  v_count integer;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM support_conversations
  WHERE created_at >= date_trunc('year', now());
  
  v_ticket := 'TKT-' || v_year || '-' || lpad(v_count::text, 5, '0');
  
  RETURN v_ticket;
END;
$function$;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  
  -- Set initial status as 'novo' for new conversations
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'novo';
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_conversations;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger to track first response time
CREATE OR REPLACE FUNCTION public.track_first_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If admin responds and first_response_at is null, set it
  IF NEW.sender_type = 'admin' THEN
    UPDATE support_conversations
    SET first_response_at = COALESCE(first_response_at, now()),
        status = CASE WHEN status = 'novo' THEN 'em_andamento' ELSE status END
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_track_first_response ON support_messages;
CREATE TRIGGER trigger_track_first_response
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION track_first_response();