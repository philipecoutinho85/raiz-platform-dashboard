-- Security hardening for token balances, financial tables, and public storage writes.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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
  v_is_admin boolean;
  v_contribution_id uuid;
  v_new_balance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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

  SELECT user_id
  INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
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

CREATE OR REPLACE FUNCTION public.admin_adjust_user_tokens(
  p_target_user_id uuid,
  p_amount integer,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_type text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Adjustment amount must not be zero';
  END IF;

  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (p_target_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_current_balance
  FROM public.user_tokens
  WHERE user_id = p_target_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Token balance cannot be negative';
  END IF;

  UPDATE public.user_tokens
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  v_transaction_type := CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END;

  INSERT INTO public.token_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_after
  )
  VALUES (
    p_target_user_id,
    p_amount,
    v_transaction_type,
    COALESCE(p_reason, 'Ajuste manual de tokens pelo admin'),
    v_new_balance
  );

  RETURN QUERY SELECT v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_user_tokens(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_tokens(uuid, integer, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.user_tokens;

DROP POLICY IF EXISTS "System can insert purchases" ON public.token_purchases;
DROP POLICY IF EXISTS "System can update purchases" ON public.token_purchases;
DROP POLICY IF EXISTS "System can insert transactions" ON public.token_transactions;

DROP POLICY IF EXISTS "System can insert payouts" ON public.creator_payouts;
DROP POLICY IF EXISTS "System can update payouts" ON public.creator_payouts;
DROP POLICY IF EXISTS "System can insert payments" ON public.stripe_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.stripe_payments;

DROP POLICY IF EXISTS "Admins can insert token_transactions" ON public.token_transactions;
CREATE POLICY "Admins can insert token_transactions"
ON public.token_transactions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert token_purchases" ON public.token_purchases;
CREATE POLICY "Admins can insert token_purchases"
ON public.token_purchases
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update token_purchases" ON public.token_purchases;
CREATE POLICY "Admins can update token_purchases"
ON public.token_purchases
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all stripe_payments" ON public.stripe_payments;
CREATE POLICY "Admins can view all stripe_payments"
ON public.stripe_payments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage stripe_payments" ON public.stripe_payments;
CREATE POLICY "Admins can manage stripe_payments"
ON public.stripe_payments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage creator_payouts" ON public.creator_payouts;
CREATE POLICY "Admins can manage creator_payouts"
ON public.creator_payouts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to project gallery" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-images'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can upload project gallery" ON storage.objects;
CREATE POLICY "Authenticated users can upload project gallery"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-gallery'
  AND auth.role() = 'authenticated'
);

CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  identifier_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, identifier_hash, window_start)
);

ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can manage function rate limits" ON public.function_rate_limits;
CREATE POLICY "Only service role can manage function rate limits"
ON public.function_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_function_rate_limit(
  p_scope text,
  p_identifier text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_scope IS NULL OR length(trim(p_scope)) = 0 THEN
    RAISE EXCEPTION 'Rate limit scope is required';
  END IF;

  IF p_identifier IS NULL OR length(trim(p_identifier)) = 0 THEN
    RAISE EXCEPTION 'Rate limit identifier is required';
  END IF;

  IF p_max_requests IS NULL OR p_max_requests < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit max requests';
  END IF;

  IF p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit window';
  END IF;

  v_hash := encode(extensions.digest(convert_to(lower(trim(p_identifier)), 'UTF8'), 'sha256'), 'hex');
  v_window_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.function_rate_limits (
    scope,
    identifier_hash,
    window_start,
    request_count
  )
  VALUES (
    p_scope,
    v_hash,
    v_window_start,
    1
  )
  ON CONFLICT (scope, identifier_hash, window_start)
  DO UPDATE SET
    request_count = public.function_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;

  DELETE FROM public.function_rate_limits
  WHERE window_start < now() - interval '7 days';

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.check_function_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_function_rate_limit(text, text, integer, integer) TO service_role;
