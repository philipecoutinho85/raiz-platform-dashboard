-- Blocks users with open Stripe risk flags from consuming tokens while disputes/refunds are under review.
-- This prevents a user from buying tokens, opening a dispute/chargeback, and continuing to support projects with disputed balance.

CREATE OR REPLACE FUNCTION public.support_project_with_tokens(
  p_project_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL
)
RETURNS TABLE(contribution_id uuid, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_project_owner uuid;
  v_project_status text;
  v_is_admin boolean;
  v_has_open_risk boolean;
  v_contribution_id uuid;
  v_new_balance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_risk_flags urf
    WHERE urf.user_id = v_user_id
      AND urf.status IN ('open', 'reviewing')
      AND urf.severity IN ('high', 'critical')
  ) INTO v_has_open_risk;

  IF COALESCE(v_has_open_risk, false) THEN
    RAISE EXCEPTION 'Account temporarily under payment review';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid token amount';
  END IF;

  SELECT balance
  INTO v_balance
  FROM public.user_tokens
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token wallet not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient token balance';
  END IF;

  SELECT user_id, status
  INTO v_project_owner, v_project_status
  FROM public.projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project_status <> 'approved' THEN
    RAISE EXCEPTION 'Project is not available for support';
  END IF;

  SELECT public.has_role(v_user_id, 'admin'::app_role)
  INTO v_is_admin;

  IF v_project_owner = v_user_id AND NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Project owners cannot support their own project';
  END IF;

  v_new_balance := v_balance - p_amount;

  INSERT INTO public.project_contributions (
    project_id,
    user_id,
    amount,
    status
  )
  VALUES (
    p_project_id,
    v_user_id,
    p_amount,
    'completed'
  )
  RETURNING id INTO v_contribution_id;

  UPDATE public.user_tokens
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.token_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    description,
    balance_after
  )
  VALUES (
    v_user_id,
    -p_amount,
    'support',
    p_project_id,
    COALESCE(p_description, 'Apoio a projeto'),
    v_new_balance
  );

  RETURN QUERY SELECT v_contribution_id, v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.support_project_with_tokens(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.support_project_with_tokens(uuid, integer, text) TO authenticated;
