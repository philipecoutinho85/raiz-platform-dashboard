-- Reconcile project aggregates and update support totals atomically.
--
-- Context:
-- `support_project_with_tokens` inserted project_contributions and token_transactions,
-- but did not consistently update projects.raised_amount/backers_count.
-- This caused project aggregate fields to diverge from the contribution ledger.

CREATE OR REPLACE FUNCTION public.recalculate_project_aggregates(p_project_id uuid)
RETURNS TABLE(project_id uuid, raised_amount numeric, backers_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raised numeric;
  v_backers integer;
BEGIN
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'Project id is required';
  END IF;

  SELECT
    COALESCE(SUM(amount), 0)::numeric,
    COUNT(DISTINCT user_id)::integer
  INTO v_raised, v_backers
  FROM public.project_contributions
  WHERE project_contributions.project_id = p_project_id
    AND status = 'completed';

  UPDATE public.projects
  SET raised_amount = v_raised,
      backers_count = v_backers,
      updated_at = now()
  WHERE id = p_project_id;

  RETURN QUERY SELECT p_project_id, v_raised, v_backers;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_project_aggregates(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_project_aggregates(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.recalculate_all_project_aggregates()
RETURNS TABLE(project_id uuid, raised_amount numeric, backers_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH aggregate_data AS (
    SELECT
      p.id AS project_id,
      COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::numeric AS raised_amount,
      COUNT(DISTINCT pc.user_id) FILTER (WHERE pc.status = 'completed')::integer AS backers_count
    FROM public.projects p
    LEFT JOIN public.project_contributions pc ON pc.project_id = p.id
    GROUP BY p.id
  ), updated AS (
    UPDATE public.projects p
    SET raised_amount = a.raised_amount,
        backers_count = a.backers_count,
        updated_at = now()
    FROM aggregate_data a
    WHERE p.id = a.project_id
      AND (
        p.raised_amount IS DISTINCT FROM a.raised_amount
        OR p.backers_count IS DISTINCT FROM a.backers_count
      )
    RETURNING p.id, p.raised_amount, p.backers_count
  )
  SELECT updated.id, updated.raised_amount, updated.backers_count
  FROM updated;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_all_project_aggregates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_all_project_aggregates() TO authenticated;

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

  SELECT user_id, status
  INTO v_project_owner, v_project_status
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

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

  UPDATE public.projects
  SET raised_amount = COALESCE(raised_amount, 0) + p_amount,
      backers_count = (
        SELECT COUNT(DISTINCT pc.user_id)::integer
        FROM public.project_contributions pc
        WHERE pc.project_id = p_project_id
          AND pc.status = 'completed'
      ),
      updated_at = now()
  WHERE id = p_project_id;

  RETURN QUERY SELECT v_contribution_id, v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.support_project_with_tokens(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.support_project_with_tokens(uuid, integer, text) TO authenticated;
