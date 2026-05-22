-- Manual token wallet reconciliation for Supabase SQL Editor.
-- Run only after applying migration 20260522210000_fix_duplicate_token_wallet_credit.sql.
-- This script does not depend on auth.uid(), because Supabase SQL Editor does not run as an app-authenticated user.
-- Replace <EMAIL_DO_USUARIO> with the user email to reconcile.

BEGIN;

WITH target_user AS (
  SELECT id AS user_id, email
  FROM auth.users
  WHERE lower(email) = lower('<EMAIL_DO_USUARIO>')
  LIMIT 1
), calculated AS (
  SELECT
    t.user_id,
    t.email,
    COALESCE(ut.balance, 0) AS previous_balance,
    COALESCE(SUM(tt.amount), 0)::integer AS reconciled_balance
  FROM target_user t
  LEFT JOIN public.user_tokens ut ON ut.user_id = t.user_id
  LEFT JOIN public.token_transactions tt ON tt.user_id = t.user_id
  GROUP BY t.user_id, t.email, ut.balance
), upsert_wallet AS (
  INSERT INTO public.user_tokens (user_id, balance, updated_at)
  SELECT user_id, reconciled_balance, now()
  FROM calculated
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = now()
  RETURNING user_id, balance
)
SELECT
  c.email,
  c.user_id,
  c.previous_balance,
  c.reconciled_balance,
  c.reconciled_balance - c.previous_balance AS difference_applied
FROM calculated c;

COMMIT;

-- Confirm result after reconciliation.
SELECT
  au.email,
  ut.balance AS wallet_balance,
  COALESCE(SUM(tt.amount), 0)::integer AS transactions_net_balance,
  ut.balance - COALESCE(SUM(tt.amount), 0)::integer AS difference
FROM public.user_tokens ut
LEFT JOIN auth.users au ON au.id = ut.user_id
LEFT JOIN public.token_transactions tt ON tt.user_id = ut.user_id
WHERE lower(au.email) = lower('<EMAIL_DO_USUARIO>')
GROUP BY au.email, ut.balance;
