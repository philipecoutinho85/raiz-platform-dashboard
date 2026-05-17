CREATE OR REPLACE FUNCTION public.rate_support_conversation(
  p_conversation_id uuid,
  p_rating integer,
  p_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_status text;
  v_closed_at timestamptz;
  v_resolved_at timestamptz;
  v_existing_rating integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation is required';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  SELECT user_id, status, closed_at, resolved_at, rating
  INTO v_owner_id, v_status, v_closed_at, v_resolved_at, v_existing_rating
  FROM public.support_conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Support conversation not found';
  END IF;

  IF v_owner_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the ticket owner can rate this support conversation';
  END IF;

  IF v_status NOT IN ('closed', 'resolvido', 'fechado') OR COALESCE(v_closed_at, v_resolved_at) IS NULL THEN
    RAISE EXCEPTION 'Only resolved or closed support conversations can be rated';
  END IF;

  IF v_existing_rating IS NOT NULL THEN
    RAISE EXCEPTION 'Support conversation already rated';
  END IF;

  UPDATE public.support_conversations
  SET rating = p_rating,
      rating_comment = NULLIF(trim(p_comment), ''),
      rated_at = now(),
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_support_conversation(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_support_conversation(uuid, integer, text) TO authenticated;
