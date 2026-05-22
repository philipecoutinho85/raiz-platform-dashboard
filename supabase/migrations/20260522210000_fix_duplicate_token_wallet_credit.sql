-- Fix duplicate token wallet credit path.
-- Context:
-- Token purchases are processed by process_token_purchase_atomic, which already:
-- 1. locks the wallet;
-- 2. updates public.user_tokens.balance;
-- 3. inserts the corresponding public.token_transactions row.
--
-- Any legacy trigger on public.token_transactions that also updates public.user_tokens.balance
-- will double-credit purchases and corrupt wallet balances.

DO $$
DECLARE
  v_trigger record;
BEGIN
  FOR v_trigger IN
    SELECT
      t.tgname AS trigger_name,
      c.relname AS table_name,
      pg_get_triggerdef(t.oid) AS trigger_definition
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'token_transactions'
      AND NOT t.tgisinternal
      AND lower(pg_get_triggerdef(t.oid)) LIKE '%user_tokens%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.token_transactions', v_trigger.trigger_name);
    RAISE NOTICE 'Dropped legacy token_transactions trigger that referenced user_tokens: %', v_trigger.trigger_name;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.reconcile_user_token_balance(
  p_user_id uuid,
  p_reason text DEFAULT 'manual_wallet_reconciliation'
)
RETURNS TABLE(previous_balance integer, reconciled_balance integer, difference integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_previous_balance integer;
  v_reconciled_balance integer;
  v_difference integer;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_previous_balance
  FROM public.user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT COALESCE(SUM(amount), 0)::integer
  INTO v_reconciled_balance
  FROM public.token_transactions
  WHERE user_id = p_user_id;

  v_difference := v_reconciled_balance - COALESCE(v_previous_balance, 0);

  IF v_difference <> 0 THEN
    UPDATE public.user_tokens
    SET balance = v_reconciled_balance,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (
      v_admin_id,
      'token_wallet_reconciliation',
      'user',
      p_user_id,
      jsonb_build_object(
        'previous_balance', v_previous_balance,
        'reconciled_balance', v_reconciled_balance,
        'difference', v_difference,
        'reason', p_reason
      )
    );
  END IF;

  RETURN QUERY SELECT COALESCE(v_previous_balance, 0), v_reconciled_balance, v_difference;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_user_token_balance(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_user_token_balance(uuid, text) TO authenticated;
