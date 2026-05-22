-- Manual token wallet reconciliation.
-- Run only after applying migration 20260522210000_fix_duplicate_token_wallet_credit.sql.
-- Replace the email below with the user email to reconcile.

SELECT *
FROM public.reconcile_user_token_balance(
  (
    SELECT id
    FROM auth.users
    WHERE lower(email) = lower('<EMAIL_DO_USUARIO>')
    LIMIT 1
  ),
  'Reconciliacao apos correcao de credito duplicado em compra de tokens'
);

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
