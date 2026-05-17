ALTER TABLE public.support_conversations
ALTER COLUMN status SET DEFAULT 'novo';

CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;

  NEW.status := 'novo';
  NEW.closed_at := NULL;
  NEW.resolved_at := NULL;
  NEW.closed_by := NULL;
  NEW.rating := NULL;
  NEW.rating_comment := NULL;
  NEW.rated_at := NULL;

  RETURN NEW;
END;
$$;

UPDATE public.support_conversations sc
SET status = 'novo',
    closed_at = NULL,
    resolved_at = NULL,
    closed_by = NULL,
    rating = NULL,
    rating_comment = NULL,
    rated_at = NULL,
    updated_at = now()
WHERE sc.status IN ('closed', 'resolvido', 'fechado')
  AND sc.created_at >= now() - interval '30 days'
  AND sc.updated_at <= sc.created_at + interval '5 minutes'
  AND NOT EXISTS (
    SELECT 1
    FROM public.support_messages sm
    WHERE sm.conversation_id = sc.id
      AND sm.sender_type = 'admin'
  );
