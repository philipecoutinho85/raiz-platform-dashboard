-- Recompute project aggregates from completed contributions instead of incrementing counters.

CREATE OR REPLACE FUNCTION public.process_stripe_project_payment_atomic(
  p_session_id text,
  p_payment_intent_id text,
  p_project_id uuid,
  p_user_id uuid,
  p_currency text,
  p_amount_cents integer,
  p_payment_method text,
  p_event_id text DEFAULT NULL
)
RETURNS TABLE(already_processed boolean, contribution_id uuid, ledger_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.stripe_payments%ROWTYPE;
  v_project public.projects%ROWTYPE;
  v_contribution_id uuid;
  v_ledger_id uuid;
  v_gross_amount numeric(12,2);
  v_token_amount integer;
  v_platform_fee_percentage numeric(5,2);
  v_fee_config record;
  v_stripe_fee_percentage numeric(10,6);
  v_stripe_fee_fixed numeric(12,2);
  v_stripe_fee_total numeric(12,2);
  v_platform_fee_amount numeric(12,2);
  v_net_creator numeric(12,2);
  v_payment_method text;
  v_grace_period_ends_at timestamptz;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RAISE EXCEPTION 'Stripe session id is required';
  END IF;

  IF p_currency IS NULL OR lower(p_currency) <> 'brl' THEN
    RAISE EXCEPTION 'Invalid currency';
  END IF;

  IF p_amount_cents IS NULL OR p_amount_cents < 500 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  SELECT fl.id, fl.contribution_id
  INTO v_ledger_id, v_contribution_id
  FROM public.financial_ledger fl
  WHERE fl.stripe_session_id = p_session_id
     OR (
       p_payment_intent_id IS NOT NULL
       AND fl.stripe_payment_intent_id = p_payment_intent_id
     )
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.stripe_payments
    SET status = 'completed',
        stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
        completed_at = COALESCE(completed_at, now())
    WHERE stripe_session_id = p_session_id
      AND status <> 'completed';

    UPDATE public.projects p
    SET raised_amount = COALESCE((
          SELECT sum(pc.amount)
          FROM public.project_contributions pc
          WHERE pc.project_id = p.id
            AND pc.status = 'completed'
        ), 0),
        backers_count = COALESCE((
          SELECT count(*)
          FROM public.project_contributions pc
          WHERE pc.project_id = p.id
            AND pc.status = 'completed'
        ), 0)
    WHERE p.id = p_project_id;

    RETURN QUERY SELECT true, v_contribution_id, v_ledger_id;
    RETURN;
  END IF;

  SELECT *
  INTO v_payment
  FROM public.stripe_payments
  WHERE stripe_session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe payment record not found';
  END IF;

  IF v_payment.status = 'completed' THEN
    SELECT fl.id, fl.contribution_id
    INTO v_ledger_id, v_contribution_id
    FROM public.financial_ledger fl
    WHERE fl.stripe_session_id = p_session_id
       OR (
         p_payment_intent_id IS NOT NULL
         AND fl.stripe_payment_intent_id = p_payment_intent_id
       )
    LIMIT 1;

    UPDATE public.projects p
    SET raised_amount = COALESCE((
          SELECT sum(pc.amount)
          FROM public.project_contributions pc
          WHERE pc.project_id = p.id
            AND pc.status = 'completed'
        ), 0),
        backers_count = COALESCE((
          SELECT count(*)
          FROM public.project_contributions pc
          WHERE pc.project_id = p.id
            AND pc.status = 'completed'
        ), 0)
    WHERE p.id = p_project_id;

    RETURN QUERY SELECT true, v_contribution_id, v_ledger_id;
    RETURN;
  END IF;

  IF v_payment.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Payment user mismatch';
  END IF;

  IF v_payment.project_id <> p_project_id THEN
    RAISE EXCEPTION 'Payment project mismatch';
  END IF;

  IF v_payment.amount <> p_amount_cents THEN
    RAISE EXCEPTION 'Payment amount mismatch';
  END IF;

  SELECT *
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.status <> 'approved' THEN
    RAISE EXCEPTION 'Project is not approved for payments';
  END IF;

  IF v_project.user_id = p_user_id THEN
    RAISE EXCEPTION 'Project owner cannot support own project with Stripe payment';
  END IF;

  v_gross_amount := round((p_amount_cents::numeric / 100), 2);
  v_token_amount := floor(v_gross_amount);
  v_payment_method := CASE WHEN p_payment_method = 'card' THEN 'card_national' ELSE p_payment_method END;
  v_platform_fee_percentage := COALESCE(v_project.platform_fee_percentage, 10);
  v_grace_period_ends_at := now() + interval '7 days';

  SELECT percentage_fee, fixed_fee, COALESCE(additional_percentage, 0) AS additional_percentage
  INTO v_fee_config
  FROM public.stripe_fee_config
  WHERE payment_method = v_payment_method
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT percentage_fee, fixed_fee, COALESCE(additional_percentage, 0) AS additional_percentage
    INTO v_fee_config
    FROM public.stripe_fee_config
    WHERE payment_method = 'card_national'
    LIMIT 1;
  END IF;

  v_stripe_fee_percentage := COALESCE(v_fee_config.percentage_fee, 0.0399) +
    COALESCE(v_fee_config.additional_percentage, 0);
  v_stripe_fee_fixed := COALESCE(v_fee_config.fixed_fee, 0.39);
  v_stripe_fee_total := round((v_gross_amount * v_stripe_fee_percentage) + v_stripe_fee_fixed, 2);

  v_platform_fee_amount := round(v_gross_amount * (v_platform_fee_percentage / 100), 2);
  v_net_creator := round(v_gross_amount - v_stripe_fee_total - v_platform_fee_amount, 2);

  INSERT INTO public.project_contributions (
    project_id,
    user_id,
    amount,
    status,
    stripe_session_id,
    stripe_payment_intent_id
  )
  VALUES (
    p_project_id,
    p_user_id,
    v_token_amount,
    'completed',
    p_session_id,
    p_payment_intent_id
  )
  RETURNING id INTO v_contribution_id;

  INSERT INTO public.financial_ledger (
    project_id,
    contribution_id,
    supporter_id,
    creator_id,
    gross_amount,
    token_amount,
    payment_method,
    stripe_fee_percentage,
    stripe_fee_fixed,
    stripe_fee_total,
    platform_fee_percentage,
    platform_fee_amount,
    net_amount_creator,
    net_amount_platform,
    financial_status,
    grace_period_ends_at,
    stripe_session_id,
    stripe_payment_intent_id
  )
  VALUES (
    p_project_id,
    v_contribution_id,
    p_user_id,
    v_project.user_id,
    v_gross_amount,
    v_token_amount,
    v_payment_method,
    v_stripe_fee_percentage,
    v_stripe_fee_fixed,
    v_stripe_fee_total,
    v_platform_fee_percentage,
    v_platform_fee_amount,
    v_net_creator,
    v_platform_fee_amount,
    'grace_period',
    v_grace_period_ends_at,
    p_session_id,
    p_payment_intent_id
  )
  RETURNING id INTO v_ledger_id;

  INSERT INTO public.ledger_movements (
    ledger_id,
    movement_type,
    amount,
    from_entity,
    to_entity,
    description,
    reference_type,
    reference_id,
    metadata
  )
  VALUES (
    v_ledger_id,
    'contribution_received',
    v_gross_amount,
    'stripe',
    'platform',
    'Pagamento recebido - Projeto: ' || v_project.title,
    'contribution',
    v_contribution_id,
    jsonb_build_object(
      'project_id', p_project_id,
      'supporter_id', p_user_id,
      'payment_method', v_payment_method,
      'stripe_fees', v_stripe_fee_total,
      'platform_fee', v_platform_fee_amount,
      'stripe_event_id', p_event_id
    )
  );

  UPDATE public.projects p
  SET raised_amount = COALESCE((
        SELECT sum(pc.amount)
        FROM public.project_contributions pc
        WHERE pc.project_id = p.id
          AND pc.status = 'completed'
      ), 0),
      backers_count = COALESCE((
        SELECT count(*)
        FROM public.project_contributions pc
        WHERE pc.project_id = p.id
          AND pc.status = 'completed'
      ), 0)
  WHERE p.id = p_project_id;

  UPDATE public.stripe_payments
  SET status = 'completed',
      stripe_payment_intent_id = p_payment_intent_id,
      completed_at = now()
  WHERE id = v_payment.id;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES
    (
      v_project.user_id,
      'new_contribution',
      'Novo apoio recebido!',
      'Seu projeto "' || v_project.title || '" recebeu um apoio de ' || v_token_amount || ' tokens.',
      p_project_id
    ),
    (
      p_user_id,
      'contribution_confirmed',
      'Apoio confirmado!',
      'Seu apoio de ' || v_token_amount || ' tokens ao projeto "' || v_project.title || '" foi confirmado.',
      p_project_id
    );

  RETURN QUERY SELECT false, v_contribution_id, v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) TO service_role;
