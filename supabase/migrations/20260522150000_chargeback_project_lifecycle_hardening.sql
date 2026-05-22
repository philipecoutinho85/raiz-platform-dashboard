-- Chargeback, dispute, and project lifecycle hardening.
-- Safe version: avoids changing existing CHECK constraints on financial_ledger and ledger_movements.
-- Adds defensive records, user risk flags, and an atomic admin cancellation/refund path.

CREATE TABLE IF NOT EXISTS public.payment_dispute_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  dispute_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_session_id text,
  source_type text NOT NULL DEFAULT 'unknown' CHECK (source_type IN ('token_purchase', 'project_payment', 'unknown')),
  purchase_id uuid,
  project_id uuid,
  contribution_id uuid,
  user_id uuid,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'brl',
  dispute_status text,
  reason text,
  tokens_debited integer NOT NULL DEFAULT 0,
  unrecovered_tokens integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_risk_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_id text NOT NULL,
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (user_id, source, source_id)
);

CREATE TABLE IF NOT EXISTS public.project_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES auth.users(id),
  tokens_refunded integer NOT NULL DEFAULT 0,
  contributions_refunded integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_dispute_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_lifecycle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view payment dispute records" ON public.payment_dispute_records;
CREATE POLICY "Admins can view payment dispute records"
ON public.payment_dispute_records
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view user risk flags" ON public.user_risk_flags;
CREATE POLICY "Admins can view user risk flags"
ON public.user_risk_flags
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own risk flags" ON public.user_risk_flags;
CREATE POLICY "Users can view own risk flags"
ON public.user_risk_flags
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view lifecycle events" ON public.project_lifecycle_events;
CREATE POLICY "Admins can view lifecycle events"
ON public.project_lifecycle_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON public.payment_dispute_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_purchase_id ON public.payment_dispute_records(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_project_id ON public.payment_dispute_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_intent ON public.payment_dispute_records(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_user_risk_flags_user_status ON public.user_risk_flags(user_id, status);
CREATE INDEX IF NOT EXISTS idx_project_lifecycle_project ON public.project_lifecycle_events(project_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_refund_transaction_once
ON public.token_transactions (reference_id)
WHERE transaction_type = 'project_refund' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chargeback_transaction_once
ON public.token_transactions (reference_id)
WHERE transaction_type = 'chargeback' AND reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.process_stripe_dispute_atomic(
  p_event_id text,
  p_event_type text,
  p_dispute_id text DEFAULT NULL,
  p_payment_intent_id text DEFAULT NULL,
  p_charge_id text DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_amount_cents integer DEFAULT 0,
  p_currency text DEFAULT 'brl',
  p_status text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(source_type text, purchase_id uuid, project_id uuid, user_id uuid, tokens_debited integer, unrecovered_tokens integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase public.token_purchases%ROWTYPE;
  v_payment public.stripe_payments%ROWTYPE;
  v_ledger public.financial_ledger%ROWTYPE;
  v_user_id uuid;
  v_project_id uuid;
  v_contribution_id uuid;
  v_source_type text := 'unknown';
  v_amount numeric(12,2) := round(COALESCE(p_amount_cents, 0)::numeric / 100, 2);
  v_balance integer := 0;
  v_debit_amount integer := 0;
  v_unrecovered integer := 0;
  v_purchase_id uuid;
BEGIN
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'Stripe event id is required';
  END IF;

  SELECT * INTO v_purchase
  FROM public.token_purchases
  WHERE (p_metadata ? 'purchase_id' AND id = NULLIF(p_metadata->>'purchase_id', '')::uuid)
     OR (p_session_id IS NOT NULL AND pagarme_transaction_id = p_session_id)
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    v_source_type := 'token_purchase';
    v_user_id := v_purchase.user_id;
    v_purchase_id := v_purchase.id;

    INSERT INTO public.user_tokens (user_id, balance)
    VALUES (v_purchase.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT balance INTO v_balance
    FROM public.user_tokens
    WHERE user_id = v_purchase.user_id
    FOR UPDATE;

    IF p_event_type IN ('charge.dispute.created', 'charge.refunded') AND v_purchase.status = 'paid' THEN
      v_debit_amount := LEAST(COALESCE(v_balance, 0), v_purchase.amount);
      v_unrecovered := GREATEST(v_purchase.amount - COALESCE(v_balance, 0), 0);

      IF v_debit_amount > 0 THEN
        UPDATE public.user_tokens
        SET balance = balance - v_debit_amount,
            updated_at = now()
        WHERE user_id = v_purchase.user_id;

        INSERT INTO public.token_transactions (
          user_id,
          amount,
          transaction_type,
          reference_id,
          description,
          balance_after
        )
        VALUES (
          v_purchase.user_id,
          -v_debit_amount,
          'chargeback',
          v_purchase.id,
          'Debito preventivo por contestacao/estorno Stripe',
          COALESCE(v_balance, 0) - v_debit_amount
        )
        ON CONFLICT DO NOTHING;
      END IF;

      UPDATE public.token_purchases
      SET status = CASE WHEN p_event_type = 'charge.refunded' THEN 'refunded' ELSE 'disputed' END,
          updated_at = now()
      WHERE id = v_purchase.id;
    END IF;
  ELSE
    SELECT * INTO v_payment
    FROM public.stripe_payments
    WHERE (p_session_id IS NOT NULL AND stripe_session_id = p_session_id)
       OR (p_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = p_payment_intent_id)
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      v_source_type := 'project_payment';
      v_user_id := v_payment.user_id;
      v_project_id := v_payment.project_id;

      SELECT * INTO v_ledger
      FROM public.financial_ledger
      WHERE (p_session_id IS NOT NULL AND stripe_session_id = p_session_id)
         OR (p_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = p_payment_intent_id)
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        v_contribution_id := v_ledger.contribution_id;

        IF p_event_type = 'charge.refunded' THEN
          UPDATE public.financial_ledger
          SET financial_status = 'refunded'
          WHERE id = v_ledger.id;
        END IF;

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
          v_ledger.id,
          CASE WHEN p_event_type = 'charge.refunded' THEN 'refund' ELSE 'adjustment' END,
          v_amount,
          'stripe',
          'platform',
          'Evento Stripe de contestacao/estorno registrado',
          'stripe_dispute',
          NULL,
          jsonb_build_object(
            'event_id', p_event_id,
            'event_type', p_event_type,
            'dispute_id', p_dispute_id,
            'payment_intent_id', p_payment_intent_id,
            'charge_id', p_charge_id,
            'status', p_status,
            'reason', p_reason
          )
        );
      END IF;

      UPDATE public.stripe_payments
      SET status = CASE WHEN p_event_type = 'charge.refunded' THEN 'refunded' ELSE 'disputed' END
      WHERE id = v_payment.id;
    END IF;
  END IF;

  INSERT INTO public.payment_dispute_records (
    event_id,
    event_type,
    dispute_id,
    stripe_payment_intent_id,
    stripe_charge_id,
    stripe_session_id,
    source_type,
    purchase_id,
    project_id,
    contribution_id,
    user_id,
    amount,
    currency,
    dispute_status,
    reason,
    tokens_debited,
    unrecovered_tokens,
    metadata
  )
  VALUES (
    p_event_id,
    p_event_type,
    p_dispute_id,
    p_payment_intent_id,
    p_charge_id,
    p_session_id,
    v_source_type,
    v_purchase_id,
    v_project_id,
    v_contribution_id,
    v_user_id,
    v_amount,
    COALESCE(p_currency, 'brl'),
    p_status,
    p_reason,
    v_debit_amount,
    v_unrecovered,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (event_id) DO UPDATE SET
    dispute_status = EXCLUDED.dispute_status,
    metadata = payment_dispute_records.metadata || EXCLUDED.metadata,
    updated_at = now();

  IF v_user_id IS NOT NULL AND (p_event_type IN ('charge.dispute.created', 'charge.refunded')) THEN
    INSERT INTO public.user_risk_flags (
      user_id,
      source,
      source_id,
      severity,
      status,
      reason,
      metadata
    )
    VALUES (
      v_user_id,
      'stripe',
      COALESCE(p_dispute_id, p_event_id),
      CASE WHEN v_unrecovered > 0 THEN 'critical' ELSE 'high' END,
      'open',
      CASE WHEN p_event_type = 'charge.refunded' THEN 'Estorno Stripe registrado' ELSE 'Contestacao Stripe aberta' END,
      jsonb_build_object(
        'event_id', p_event_id,
        'event_type', p_event_type,
        'source_type', v_source_type,
        'tokens_debited', v_debit_amount,
        'unrecovered_tokens', v_unrecovered,
        'amount', v_amount
      )
    )
    ON CONFLICT (user_id, source, source_id) DO UPDATE SET
      severity = EXCLUDED.severity,
      status = 'open',
      metadata = user_risk_flags.metadata || EXCLUDED.metadata;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_user_id,
      'payment_dispute',
      'Pagamento em análise',
      'Identificamos uma contestação ou estorno relacionado a um pagamento. Algumas movimentações podem ficar em análise até a regularização.',
      COALESCE(v_purchase_id, v_project_id)
    );
  END IF;

  RETURN QUERY SELECT v_source_type, v_purchase_id, v_project_id, v_user_id, v_debit_amount, v_unrecovered;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_project_and_refund_tokens_atomic(
  p_project_id uuid,
  p_reason text DEFAULT 'admin_cancelled'
)
RETURNS TABLE(project_id uuid, previous_status text, new_status text, contributions_refunded integer, tokens_refunded integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_admin_type text;
  v_project public.projects%ROWTYPE;
  v_contribution record;
  v_balance integer;
  v_new_balance integer;
  v_count integer := 0;
  v_tokens integer := 0;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT admin_type INTO v_admin_type
  FROM public.user_roles
  WHERE user_id = v_admin_id
    AND role = 'admin'::app_role
    AND admin_type IN ('master', 'financial')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial administrator role required';
  END IF;

  SELECT * INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.status IN ('cancelled', 'deleted') THEN
    RETURN QUERY SELECT v_project.id, v_project.status, v_project.status, 0, 0;
    RETURN;
  END IF;

  UPDATE public.projects
  SET status = 'cancelled',
      reviewed_at = now(),
      reviewed_by = v_admin_id,
      updated_at = now()
  WHERE id = p_project_id;

  FOR v_contribution IN
    SELECT pc.id, pc.user_id, pc.amount
    FROM public.project_contributions pc
    WHERE pc.project_id = p_project_id
      AND pc.status = 'completed'
      AND NOT EXISTS (
        SELECT 1
        FROM public.token_transactions tt
        WHERE tt.reference_id = pc.id
          AND tt.transaction_type = 'project_refund'
      )
    FOR UPDATE
  LOOP
    INSERT INTO public.user_tokens (user_id, balance)
    VALUES (v_contribution.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT balance INTO v_balance
    FROM public.user_tokens
    WHERE user_id = v_contribution.user_id
    FOR UPDATE;

    v_new_balance := COALESCE(v_balance, 0) + v_contribution.amount;

    UPDATE public.user_tokens
    SET balance = v_new_balance,
        updated_at = now()
    WHERE user_id = v_contribution.user_id;

    INSERT INTO public.token_transactions (
      user_id,
      amount,
      transaction_type,
      reference_id,
      description,
      balance_after
    )
    VALUES (
      v_contribution.user_id,
      v_contribution.amount,
      'project_refund',
      v_contribution.id,
      'Devolucao de tokens por cancelamento de projeto',
      v_new_balance
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.refunds (
      user_id,
      project_id,
      contribution_id,
      amount,
      reason,
      status,
      requested_by,
      processed_by,
      processed_at
    )
    VALUES (
      v_contribution.user_id,
      p_project_id,
      v_contribution.id,
      v_contribution.amount,
      COALESCE(p_reason, 'project_cancelled'),
      'completed',
      v_admin_id,
      v_admin_id,
      now()
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_contribution.user_id,
      'project_refund',
      'Tokens devolvidos',
      'Os tokens do seu apoio foram devolvidos porque o projeto foi cancelado.',
      p_project_id
    );

    v_count := v_count + 1;
    v_tokens := v_tokens + v_contribution.amount;
  END LOOP;

  INSERT INTO public.project_lifecycle_events (
    project_id,
    event_type,
    previous_status,
    new_status,
    performed_by,
    tokens_refunded,
    contributions_refunded,
    metadata
  )
  VALUES (
    p_project_id,
    'cancel_and_refund',
    v_project.status,
    'cancelled',
    v_admin_id,
    v_tokens,
    v_count,
    jsonb_build_object('reason', p_reason)
  );

  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    v_admin_id,
    'project_cancel_refund_atomic',
    'project',
    p_project_id,
    jsonb_build_object(
      'previous_status', v_project.status,
      'new_status', 'cancelled',
      'tokens_refunded', v_tokens,
      'contributions_refunded', v_count,
      'reason', p_reason
    )
  );

  RETURN QUERY SELECT p_project_id, v_project.status, 'cancelled'::text, v_count, v_tokens;
END;
$$;

REVOKE ALL ON FUNCTION public.process_stripe_dispute_atomic(text, text, text, text, text, text, integer, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_project_and_refund_tokens_atomic(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.process_stripe_dispute_atomic(text, text, text, text, text, text, integer, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_project_and_refund_tokens_atomic(uuid, text) TO authenticated;
GRANT SELECT ON public.payment_dispute_records TO authenticated;
GRANT SELECT ON public.user_risk_flags TO authenticated;
GRANT SELECT ON public.project_lifecycle_events TO authenticated;
