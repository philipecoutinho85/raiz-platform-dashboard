-- Targeted wallet correction for duplicated token credit incident.
-- User: phcoutinho85@gmail.com
-- Expected operational balance after two confirmed purchases of 5 tokens: 50.
--
-- Context:
-- - Wallet balance observed: 60
-- - Token transactions net observed: 40
-- - Expected operational balance: 50
--
-- This script:
-- 1. Locks the target wallet.
-- 2. Inserts an administrative reconciliation transaction for the historical +10 gap.
-- 3. Sets wallet balance to the expected operational balance: 50.
-- 4. Confirms wallet balance equals transaction net after correction.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'phcoutinho85@gmail.com';
  v_previous_wallet_balance integer;
  v_transactions_net_balance integer;
  v_expected_balance integer := 50;
  v_reconciliation_amount integer;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email %', v_email;
  END IF;

  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance
  INTO v_previous_wallet_balance
  FROM public.user_tokens
  WHERE user_id = v_user_id
  FOR UPDATE;

  SELECT COALESCE(SUM(amount), 0)::integer
  INTO v_transactions_net_balance
  FROM public.token_transactions
  WHERE user_id = v_user_id;

  v_reconciliation_amount := v_expected_balance - v_transactions_net_balance;

  IF v_reconciliation_amount <> 0 THEN
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
      v_reconciliation_amount,
      'adjustment',
      NULL,
      'Reconciliação administrativa: alinhamento do saldo histórico após incidente de crédito duplicado em compra de tokens',
      v_expected_balance
    );
  END IF;

  UPDATE public.user_tokens
  SET balance = v_expected_balance,
      updated_at = now()
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Wallet corrected for %. Previous wallet balance: %, previous transactions net: %, reconciliation amount: %, expected balance: %',
    v_email,
    v_previous_wallet_balance,
    v_transactions_net_balance,
    v_reconciliation_amount,
    v_expected_balance;
END $$;

COMMIT;

SELECT
  au.email,
  ut.balance AS wallet_balance,
  COALESCE(SUM(tt.amount), 0)::integer AS transactions_net_balance,
  ut.balance - COALESCE(SUM(tt.amount), 0)::integer AS difference
FROM public.user_tokens ut
LEFT JOIN auth.users au ON au.id = ut.user_id
LEFT JOIN public.token_transactions tt ON tt.user_id = ut.user_id
WHERE lower(au.email) = lower('phcoutinho85@gmail.com')
GROUP BY au.email, ut.balance;
