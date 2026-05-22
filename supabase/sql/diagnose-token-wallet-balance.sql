-- Token wallet balance diagnostic script.
-- Read-only.
-- Replace <EMAIL_DO_USUARIO> with the email used in the token purchase.

WITH target_user AS (
  SELECT id AS user_id, email
  FROM auth.users
  WHERE lower(email) = lower('<EMAIL_DO_USUARIO>')
  LIMIT 1
), tx AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0)::integer AS transactions_net_balance,
    COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'purchase'), 0)::integer AS purchase_transactions_total,
    COUNT(*) AS transactions_count
  FROM public.token_transactions
  WHERE user_id = (SELECT user_id FROM target_user)
  GROUP BY user_id
), purchases AS (
  SELECT
    user_id,
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::integer AS paid_purchase_tokens_total,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_purchases_count
  FROM public.token_purchases
  WHERE user_id = (SELECT user_id FROM target_user)
  GROUP BY user_id
)
SELECT
  t.email,
  t.user_id,
  COALESCE(ut.balance, 0) AS wallet_balance,
  COALESCE(tx.transactions_net_balance, 0) AS transactions_net_balance,
  COALESCE(ut.balance, 0) - COALESCE(tx.transactions_net_balance, 0) AS wallet_minus_transactions_difference,
  COALESCE(p.paid_purchase_tokens_total, 0) AS paid_purchase_tokens_total,
  COALESCE(tx.purchase_transactions_total, 0) AS purchase_transactions_total,
  COALESCE(p.paid_purchase_tokens_total, 0) - COALESCE(tx.purchase_transactions_total, 0) AS purchases_minus_purchase_transactions_difference,
  COALESCE(tx.transactions_count, 0) AS transactions_count,
  COALESCE(p.paid_purchases_count, 0) AS paid_purchases_count,
  ut.updated_at AS wallet_updated_at
FROM target_user t
LEFT JOIN public.user_tokens ut ON ut.user_id = t.user_id
LEFT JOIN tx ON tx.user_id = t.user_id
LEFT JOIN purchases p ON p.user_id = t.user_id;

SELECT
  tt.id,
  tt.user_id,
  tt.amount,
  tt.transaction_type,
  tt.reference_id,
  tt.description,
  tt.balance_after,
  tt.created_at
FROM public.token_transactions tt
WHERE tt.user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('<EMAIL_DO_USUARIO>') LIMIT 1)
ORDER BY tt.created_at DESC
LIMIT 20;

SELECT
  tp.id,
  tp.user_id,
  tp.amount,
  tp.price,
  tp.payment_method,
  tp.payment_type,
  tp.status,
  tp.pagarme_transaction_id,
  tp.created_at,
  tp.updated_at
FROM public.token_purchases tp
WHERE tp.user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('<EMAIL_DO_USUARIO>') LIMIT 1)
ORDER BY tp.created_at DESC
LIMIT 20;
