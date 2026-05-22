-- Token wallet balance diagnostic script.
-- Read-only. Replace <USER_ID_AQUI> with the user_id to investigate.

WITH target_user AS (
  SELECT '<USER_ID_AQUI>'::uuid AS user_id
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
  id,
  amount,
  transaction_type,
  reference_id,
  description,
  balance_after,
  created_at
FROM public.token_transactions
WHERE user_id = '<USER_ID_AQUI>'::uuid
ORDER BY created_at DESC
LIMIT 20;

SELECT
  id,
  amount,
  price,
  payment_method,
  payment_type,
  status,
  pagarme_transaction_id,
  created_at,
  updated_at
FROM public.token_purchases
WHERE user_id = '<USER_ID_AQUI>'::uuid
ORDER BY created_at DESC
LIMIT 20;
