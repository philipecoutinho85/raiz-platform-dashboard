-- Financial idempotency hardening for Stripe webhooks, manual verification, token credits, and project payments.

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  object_id text,
  source text NOT NULL DEFAULT 'stripe',
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'ignored', 'failed')),
  duplicate_count integer NOT NULL DEFAULT 0,
  metadata jsonb,
  error_message text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view stripe processed events" ON public.stripe_processed_events;
CREATE POLICY "Only admins can view stripe processed events"
ON public.stripe_processed_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only service role can manage stripe processed events" ON public.stripe_processed_events;
CREATE POLICY "Only service role can manage stripe processed events"
ON public.stripe_processed_events
FOR ALL
USING (false)
WITH CHECK (false);

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_purchase_transaction_once
ON public.token_transactions (reference_id)
WHERE transaction_type = 'purchase' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_refund_transaction_once
ON public.token_transactions (reference_id)
WHERE transaction_type = 'refund' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_payments_session_once
ON public.stripe_payments (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_payments_intent_once
ON public.stripe_payments (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_ledger_session_once
ON public.financial_ledger (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_ledger_intent_once
ON public.financial_ledger (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_payouts_stripe_payout_once
ON public.creator_payouts (stripe_payout_id)
WHERE stripe_payout_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_contribution_once
ON public.refunds (contribution_id)
WHERE contribution_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_refund_movement_once
ON public.ledger_movements (reference_type, reference_id, movement_type)
WHERE reference_id IS NOT NULL AND movement_type = 'refund';

CREATE OR REPLACE FUNCTION public.record_stripe_event_once(
  p_event_id text,
  p_event_type text,
  p_object_id text DEFAULT NULL,
  p_source text DEFAULT 'stripe',
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'Stripe event id is required';
  END IF;

  INSERT INTO public.stripe_processed_events (
    event_id,
    event_type,
    object_id,
    source,
    status,
    metadata
  )
  VALUES (
    p_event_id,
    COALESCE(NULLIF(trim(p_event_type), ''), 'unknown'),
    p_object_id,
    COALESCE(NULLIF(trim(p_source), ''), 'stripe'),
    'processing',
    p_metadata
  )
  ON CONFLICT (event_id)
  DO UPDATE SET
    duplicate_count = public.stripe_processed_events.duplicate_count + 1,
    status = 'processing',
    error_message = NULL,
    metadata = COALESCE(EXCLUDED.metadata, public.stripe_processed_events.metadata),
    updated_at = now()
  WHERE public.stripe_processed_events.status = 'failed';

  IF FOUND THEN
    RETURN true;
  END IF;

  UPDATE public.stripe_processed_events
  SET duplicate_count = duplicate_count + 1,
      updated_at = now()
  WHERE event_id = p_event_id;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_stripe_event_processed(
  p_event_id text,
  p_status text DEFAULT 'processed',
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.stripe_processed_events
  SET status = CASE
        WHEN p_status IN ('processed', 'ignored', 'failed') THEN p_status
        ELSE 'processed'
      END,
      error_message = p_error_message,
      metadata = COALESCE(p_metadata, metadata),
      processed_at = CASE
        WHEN p_status IN ('processed', 'ignored') THEN COALESCE(processed_at, now())
        ELSE processed_at
      END,
      updated_at = now()
  WHERE event_id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_token_purchase_atomic(
  p_purchase_id uuid,
  p_user_id uuid,
  p_tokens_amount integer,
  p_stripe_session_id text,
  p_stripe_payment_status text DEFAULT 'paid',
  p_payment_type text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_event_id text DEFAULT NULL
)
RETURNS TABLE(already_processed boolean, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase public.token_purchases%ROWTYPE;
  v_balance integer;
  v_new_balance integer;
BEGIN
  IF p_purchase_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Purchase and user are required';
  END IF;

  IF p_tokens_amount IS NULL OR p_tokens_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid token amount';
  END IF;

  SELECT *
  INTO v_purchase
  FROM public.token_purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token purchase not found';
  END IF;

  IF v_purchase.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Purchase user mismatch';
  END IF;

  IF v_purchase.amount <> p_tokens_amount THEN
    RAISE EXCEPTION 'Purchase amount mismatch';
  END IF;

  IF p_stripe_session_id IS NOT NULL
     AND v_purchase.pagarme_transaction_id IS NOT NULL
     AND v_purchase.pagarme_transaction_id <> p_stripe_session_id THEN
    RAISE EXCEPTION 'Stripe session mismatch';
  END IF;

  IF p_payment_type IS NOT NULL OR p_expires_at IS NOT NULL OR p_stripe_session_id IS NOT NULL THEN
    UPDATE public.token_purchases
    SET payment_type = COALESCE(p_payment_type, payment_type),
        expires_at = COALESCE(p_expires_at, expires_at),
        pagarme_transaction_id = COALESCE(p_stripe_session_id, pagarme_transaction_id),
        updated_at = now()
    WHERE id = p_purchase_id;
  END IF;

  IF v_purchase.status = 'paid' THEN
    SELECT balance INTO v_balance
    FROM public.user_tokens
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT true, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  IF p_stripe_payment_status <> 'paid' THEN
    RETURN QUERY SELECT false, COALESCE((SELECT balance FROM public.user_tokens WHERE user_id = p_user_id), 0);
    RETURN;
  END IF;

  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_balance
  FROM public.user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := COALESCE(v_balance, 0) + p_tokens_amount;

  UPDATE public.user_tokens
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.token_purchases
  SET status = 'paid',
      payment_type = COALESCE(p_payment_type, payment_type),
      expires_at = COALESCE(p_expires_at, expires_at),
      pagarme_transaction_id = COALESCE(p_stripe_session_id, pagarme_transaction_id),
      updated_at = now()
  WHERE id = p_purchase_id;

  INSERT INTO public.token_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    description,
    balance_after
  )
  VALUES (
    p_user_id,
    p_tokens_amount,
    'purchase',
    p_purchase_id,
    'Compra de ' || p_tokens_amount || ' tokens via Stripe',
    v_new_balance
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id
  )
  VALUES (
    p_user_id,
    'token_purchase',
    'Compra de Tokens Confirmada!',
    'Sua compra de ' || p_tokens_amount || ' tokens foi confirmada e ja esta disponivel em sua carteira!',
    p_purchase_id
  );

  RETURN QUERY SELECT false, v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_token_purchase_if_unpaid(
  p_purchase_id uuid,
  p_stripe_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase public.token_purchases%ROWTYPE;
BEGIN
  SELECT *
  INTO v_purchase
  FROM public.token_purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token purchase not found';
  END IF;

  IF p_stripe_session_id IS NOT NULL
     AND v_purchase.pagarme_transaction_id IS NOT NULL
     AND v_purchase.pagarme_transaction_id <> p_stripe_session_id THEN
    RAISE EXCEPTION 'Stripe session mismatch';
  END IF;

  IF v_purchase.status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.token_purchases
  SET status = 'failed',
      updated_at = now()
  WHERE id = p_purchase_id;

  RETURN true;
END;
$$;

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

  SELECT *
  INTO v_payment
  FROM public.stripe_payments
  WHERE stripe_session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe payment record not found';
  END IF;

  IF v_payment.status = 'completed' THEN
    SELECT id
    INTO v_ledger_id
    FROM public.financial_ledger
    WHERE stripe_session_id = p_session_id
    LIMIT 1;

    SELECT contribution_id
    INTO v_contribution_id
    FROM public.financial_ledger
    WHERE stripe_session_id = p_session_id
    LIMIT 1;

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
    status
  )
  VALUES (
    p_project_id,
    p_user_id,
    v_token_amount,
    'completed'
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

  UPDATE public.projects
  SET raised_amount = COALESCE(raised_amount, 0) + v_token_amount,
      backers_count = COALESCE(backers_count, 0) + 1
  WHERE id = p_project_id;

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
      'Nova contribuicao recebida!',
      'Voce recebeu uma contribuicao de R$ ' || v_token_amount || ' no projeto "' || v_project.title || '"',
      p_project_id
    ),
    (
      p_user_id,
      'payment_success',
      'Pagamento confirmado!',
      'Sua contribuicao de R$ ' || v_token_amount || ' foi confirmada para o projeto "' || v_project.title || '"',
      p_project_id
    );

  RETURN QUERY SELECT false, v_contribution_id, v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_stripe_event_once(text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_stripe_event_processed(text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_token_purchase_atomic(uuid, uuid, integer, text, text, text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_token_purchase_if_unpaid(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_stripe_event_once(text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stripe_event_processed(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_token_purchase_atomic(uuid, uuid, integer, text, text, text, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_token_purchase_if_unpaid(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO public.user_tokens (user_id, balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT balance
    INTO current_balance
    FROM public.user_tokens
    WHERE user_id = NEW.user_id
    FOR UPDATE;

    new_balance := current_balance + NEW.amount;

    UPDATE public.user_tokens
    SET balance = new_balance,
        updated_at = now()
    WHERE user_id = NEW.user_id;

    INSERT INTO public.token_transactions (
      user_id,
      amount,
      transaction_type,
      reference_id,
      description,
      balance_after
    )
    VALUES (
      NEW.user_id,
      NEW.amount,
      'refund',
      NEW.id,
      'Reembolso de ' || NEW.amount || ' tokens',
      new_balance
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_refund() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.process_admin_refund_atomic(
  p_refund_id uuid,
  p_source text DEFAULT 'refund_requests',
  p_action text DEFAULT 'approve',
  p_rejection_reason text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL,
  p_proof_url text DEFAULT NULL
)
RETURNS TABLE(already_processed boolean, refund_status text, balance_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_admin_type text;
  v_request public.refund_requests%ROWTYPE;
  v_refund public.refunds%ROWTYPE;
  v_purchase public.token_purchases%ROWTYPE;
  v_balance integer;
  v_new_balance integer;
  v_tokens_amount integer;
  v_previous_status text;
  v_ledger_id uuid;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT admin_type
  INTO v_admin_type
  FROM public.user_roles
  WHERE user_id = v_admin_id
    AND role = 'admin'::app_role
    AND admin_type IN ('master', 'financial')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial administrator role required';
  END IF;

  IF p_refund_id IS NULL THEN
    RAISE EXCEPTION 'Refund id is required';
  END IF;

  IF p_action NOT IN ('analyze', 'approve', 'complete', 'reject') THEN
    RAISE EXCEPTION 'Invalid refund action';
  END IF;

  IF p_source = 'refund_requests' THEN
    SELECT *
    INTO v_request
    FROM public.refund_requests
    WHERE id = p_refund_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Refund request not found';
    END IF;

    v_previous_status := v_request.status;

    IF p_action = 'analyze' THEN
      IF v_request.status = 'em_analise' THEN
        RETURN QUERY SELECT true, v_request.status, NULL::integer;
        RETURN;
      END IF;

      IF v_request.status IN ('aprovado', 'realizado', 'rejeitado') THEN
        RAISE EXCEPTION 'Refund request cannot be moved to analysis from status %', v_request.status;
      END IF;

      UPDATE public.refund_requests
      SET status = 'em_analise',
          analyzed_at = now(),
          analyzed_by = v_admin_id,
          admin_notes = COALESCE(p_admin_notes, admin_notes),
          updated_at = now()
      WHERE id = p_refund_id;

      INSERT INTO public.refund_status_history (
        refund_request_id, previous_status, new_status, changed_by, notes
      )
      VALUES (p_refund_id, v_previous_status, 'em_analise', v_admin_id, p_admin_notes);

      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        v_admin_id,
        'refund_request_analyze',
        'refund_request',
        p_refund_id,
        jsonb_build_object('previous_status', v_previous_status, 'new_status', 'em_analise')
      );

      RETURN QUERY SELECT false, 'em_analise'::text, NULL::integer;
      RETURN;
    END IF;

    IF p_action = 'reject' THEN
      IF v_request.status = 'rejeitado' THEN
        RETURN QUERY SELECT true, v_request.status, NULL::integer;
        RETURN;
      END IF;

      IF v_request.status = 'realizado' THEN
        RAISE EXCEPTION 'Completed refund request cannot be rejected';
      END IF;

      UPDATE public.refund_requests
      SET status = 'rejeitado',
          rejection_reason = p_rejection_reason,
          analyzed_at = COALESCE(analyzed_at, now()),
          analyzed_by = COALESCE(analyzed_by, v_admin_id),
          admin_notes = COALESCE(p_admin_notes, admin_notes),
          updated_at = now()
      WHERE id = p_refund_id;

      INSERT INTO public.refund_status_history (
        refund_request_id, previous_status, new_status, changed_by, notes
      )
      VALUES (
        p_refund_id,
        v_previous_status,
        'rejeitado',
        v_admin_id,
        COALESCE('Reembolso rejeitado. Motivo: ' || p_rejection_reason, p_admin_notes)
      );

      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        v_request.user_id,
        'Reembolso Rejeitado',
        'Sua solicitacao de reembolso foi rejeitada. Motivo: ' || COALESCE(p_rejection_reason, 'nao informado'),
        'refund_update',
        p_refund_id
      );

      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        v_admin_id,
        'refund_request_reject',
        'refund_request',
        p_refund_id,
        jsonb_build_object('previous_status', v_previous_status, 'reason', p_rejection_reason)
      );

      RETURN QUERY SELECT false, 'rejeitado'::text, NULL::integer;
      RETURN;
    END IF;

    IF p_action IN ('approve', 'complete') THEN
      IF p_action = 'approve' AND v_request.status IN ('aprovado', 'realizado') THEN
        SELECT balance
        INTO v_balance
        FROM public.user_tokens
        WHERE user_id = v_request.user_id;

        RETURN QUERY SELECT true, v_request.status, COALESCE(v_balance, 0);
        RETURN;
      END IF;

      IF p_action = 'complete' AND v_request.status = 'realizado' THEN
        SELECT balance
        INTO v_balance
        FROM public.user_tokens
        WHERE user_id = v_request.user_id;

        RETURN QUERY SELECT true, v_request.status, COALESCE(v_balance, 0);
        RETURN;
      END IF;

      IF v_request.status = 'rejeitado' THEN
        RAISE EXCEPTION 'Rejected refund request cannot be approved or completed';
      END IF;

      IF p_action = 'complete' AND p_proof_url IS NULL THEN
        RAISE EXCEPTION 'Proof of payment is required to complete refund';
      END IF;

      IF v_request.status <> 'aprovado' THEN
        SELECT *
        INTO v_purchase
        FROM public.token_purchases
        WHERE id = v_request.transaction_id::uuid
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Token purchase not found for refund request';
        END IF;

        IF v_purchase.user_id <> v_request.user_id THEN
          RAISE EXCEPTION 'Refund request user does not match token purchase user';
        END IF;

        IF v_purchase.status NOT IN ('paid', 'refunded') THEN
          RAISE EXCEPTION 'Only paid purchases can be refunded';
        END IF;

        v_tokens_amount := v_purchase.amount;

        INSERT INTO public.user_tokens (user_id, balance)
        VALUES (v_request.user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;

        SELECT balance
        INTO v_balance
        FROM public.user_tokens
        WHERE user_id = v_request.user_id
        FOR UPDATE;

        IF v_balance < v_tokens_amount THEN
          RAISE EXCEPTION 'Insufficient token balance for refund debit';
        END IF;

        v_new_balance := v_balance - v_tokens_amount;

        UPDATE public.user_tokens
        SET balance = v_new_balance,
            updated_at = now()
        WHERE user_id = v_request.user_id;

        INSERT INTO public.token_transactions (
          user_id, amount, transaction_type, reference_id, description, balance_after
        )
        VALUES (
          v_request.user_id,
          -v_tokens_amount,
          'refund',
          p_refund_id,
          'Reembolso aprovado - ' || v_tokens_amount || ' tokens debitados',
          v_new_balance
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO public.ledger_movements (
          movement_type, amount, from_entity, to_entity, description,
          reference_type, reference_id, metadata
        )
        VALUES (
          'refund',
          v_request.amount,
          v_request.user_id::text,
          'platform',
          'Debito de tokens para reembolso administrativo',
          'refund_request',
          p_refund_id,
          jsonb_build_object(
            'admin_id', v_admin_id,
            'tokens_debited', v_tokens_amount,
            'previous_balance', v_balance,
            'new_balance', v_new_balance,
            'payment_method', v_request.payment_method
          )
        )
        ON CONFLICT DO NOTHING;
      ELSE
        SELECT balance
        INTO v_new_balance
        FROM public.user_tokens
        WHERE user_id = v_request.user_id;
      END IF;

      UPDATE public.refund_requests
      SET status = CASE WHEN p_action = 'complete' THEN 'realizado' ELSE 'aprovado' END,
          analyzed_at = COALESCE(analyzed_at, now()),
          analyzed_by = COALESCE(analyzed_by, v_admin_id),
          completed_at = CASE WHEN p_action = 'complete' THEN now() ELSE completed_at END,
          completed_by = CASE WHEN p_action = 'complete' THEN v_admin_id ELSE completed_by END,
          proof_of_payment_url = COALESCE(p_proof_url, proof_of_payment_url),
          admin_notes = COALESCE(p_admin_notes, admin_notes),
          updated_at = now()
      WHERE id = p_refund_id;

      IF p_action = 'complete' THEN
        UPDATE public.token_purchases
        SET status = 'refunded',
            updated_at = now()
        WHERE id = v_request.transaction_id::uuid
          AND status <> 'refunded';
      END IF;

      INSERT INTO public.refund_status_history (
        refund_request_id, previous_status, new_status, changed_by, notes, proof_url
      )
      VALUES (
        p_refund_id,
        v_previous_status,
        CASE WHEN p_action = 'complete' THEN 'realizado' ELSE 'aprovado' END,
        v_admin_id,
        COALESCE(p_admin_notes, CASE WHEN p_action = 'complete' THEN 'Reembolso processado e comprovante anexado' ELSE 'Reembolso aprovado e tokens debitados' END),
        p_proof_url
      );

      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        v_request.user_id,
        CASE WHEN p_action = 'complete' THEN 'Reembolso Realizado' ELSE 'Reembolso Aprovado' END,
        CASE
          WHEN p_action = 'complete' THEN 'Seu reembolso foi concluido.'
          ELSE 'Seu reembolso foi aprovado. Os tokens foram removidos da sua carteira.'
        END,
        'refund_update',
        p_refund_id
      );

      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        v_admin_id,
        CASE WHEN p_action = 'complete' THEN 'refund_request_complete' ELSE 'refund_request_approve' END,
        'refund_request',
        p_refund_id,
        jsonb_build_object(
          'previous_status', v_previous_status,
          'new_status', CASE WHEN p_action = 'complete' THEN 'realizado' ELSE 'aprovado' END,
          'balance_after', v_new_balance,
          'proof_url', p_proof_url
        )
      );

      RETURN QUERY SELECT false, CASE WHEN p_action = 'complete' THEN 'realizado' ELSE 'aprovado' END, v_new_balance;
      RETURN;
    END IF;
  ELSIF p_source = 'refunds' THEN
    SELECT *
    INTO v_refund
    FROM public.refunds
    WHERE id = p_refund_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Refund not found';
    END IF;

    v_previous_status := v_refund.status;

    IF p_action = 'reject' THEN
      IF v_refund.status = 'rejected' THEN
        RETURN QUERY SELECT true, v_refund.status, NULL::integer;
        RETURN;
      END IF;

      IF v_refund.status = 'completed' THEN
        RAISE EXCEPTION 'Completed refund cannot be rejected';
      END IF;

      UPDATE public.refunds
      SET status = 'rejected',
          processed_by = v_admin_id,
          processed_at = now()
      WHERE id = p_refund_id;

      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        v_admin_id,
        'refund_reject',
        'refund',
        p_refund_id,
        jsonb_build_object('previous_status', v_previous_status, 'reason', p_rejection_reason)
      );

      RETURN QUERY SELECT false, 'rejected'::text, NULL::integer;
      RETURN;
    END IF;

    IF p_action IN ('approve', 'complete') THEN
      IF v_refund.status = 'completed' THEN
        SELECT balance
        INTO v_balance
        FROM public.user_tokens
        WHERE user_id = v_refund.user_id;

        RETURN QUERY SELECT true, v_refund.status, COALESCE(v_balance, 0);
        RETURN;
      END IF;

      IF v_refund.status = 'rejected' THEN
        RAISE EXCEPTION 'Rejected refund cannot be completed';
      END IF;

      INSERT INTO public.user_tokens (user_id, balance)
      VALUES (v_refund.user_id, 0)
      ON CONFLICT (user_id) DO NOTHING;

      SELECT balance
      INTO v_balance
      FROM public.user_tokens
      WHERE user_id = v_refund.user_id
      FOR UPDATE;

      v_new_balance := v_balance + v_refund.amount;

      UPDATE public.user_tokens
      SET balance = v_new_balance,
          updated_at = now()
      WHERE user_id = v_refund.user_id;

      UPDATE public.refunds
      SET status = 'completed',
          processed_by = v_admin_id,
          processed_at = now()
      WHERE id = p_refund_id;

      INSERT INTO public.token_transactions (
        user_id, amount, transaction_type, reference_id, description, balance_after
      )
      VALUES (
        v_refund.user_id,
        v_refund.amount,
        'refund',
        p_refund_id,
        'Reembolso de ' || v_refund.amount || ' tokens',
        v_new_balance
      )
      ON CONFLICT DO NOTHING;

      SELECT id
      INTO v_ledger_id
      FROM public.financial_ledger
      WHERE contribution_id = v_refund.contribution_id
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.financial_ledger
        SET financial_status = 'refunded'
        WHERE id = v_ledger_id;
      END IF;

      INSERT INTO public.ledger_movements (
        ledger_id, movement_type, amount, from_entity, to_entity, description,
        reference_type, reference_id, metadata
      )
      VALUES (
        v_ledger_id,
        'refund',
        v_refund.amount,
        'platform',
        v_refund.user_id::text,
        'Reembolso de tokens processado pelo administrador',
        'refund',
        p_refund_id,
        jsonb_build_object(
          'admin_id', v_admin_id,
          'previous_balance', v_balance,
          'new_balance', v_new_balance,
          'contribution_id', v_refund.contribution_id
        )
      )
      ON CONFLICT DO NOTHING;

      INSERT INTO public.notifications (user_id, title, message, type, related_id)
      VALUES (
        v_refund.user_id,
        'Reembolso Aprovado',
        'Seu reembolso de ' || v_refund.amount || ' tokens foi processado.',
        'refund',
        p_refund_id
      );

      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        v_admin_id,
        'refund_complete',
        'refund',
        p_refund_id,
        jsonb_build_object(
          'previous_status', v_previous_status,
          'balance_after', v_new_balance,
          'contribution_id', v_refund.contribution_id
        )
      );

      RETURN QUERY SELECT false, 'completed'::text, v_new_balance;
      RETURN;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid refund source';
  END IF;

  RAISE EXCEPTION 'Unsupported refund action';
END;
$$;

REVOKE ALL ON FUNCTION public.process_admin_refund_atomic(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_admin_refund_atomic(uuid, text, text, text, text, text) TO authenticated;
