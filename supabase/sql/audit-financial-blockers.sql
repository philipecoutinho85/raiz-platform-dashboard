-- Financial blocker audit script.
-- Read-only.
-- Purpose: identify financial inconsistencies that should block production readiness.

-- 1. Wallet balances that do not match token transaction ledger.
WITH ledger AS (
  SELECT
    tt.user_id,
    COALESCE(SUM(tt.amount), 0)::integer AS ledger_balance
  FROM public.token_transactions tt
  GROUP BY tt.user_id
)
SELECT
  'wallet_ledger_mismatch' AS blocker_type,
  au.email,
  ut.user_id,
  COALESCE(ut.balance, 0) AS wallet_balance,
  COALESCE(l.ledger_balance, 0) AS ledger_balance,
  COALESCE(ut.balance, 0) - COALESCE(l.ledger_balance, 0) AS difference
FROM public.user_tokens ut
LEFT JOIN auth.users au ON au.id = ut.user_id
LEFT JOIN ledger l ON l.user_id = ut.user_id
WHERE COALESCE(ut.balance, 0) <> COALESCE(l.ledger_balance, 0)
ORDER BY ABS(COALESCE(ut.balance, 0) - COALESCE(l.ledger_balance, 0)) DESC;

-- 2. Project aggregate mismatches against completed contributions.
WITH contribution_totals AS (
  SELECT
    pc.project_id,
    COUNT(DISTINCT pc.user_id) FILTER (WHERE pc.status = 'completed')::integer AS completed_backers_count,
    COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::numeric AS completed_contributions_tokens
  FROM public.project_contributions pc
  GROUP BY pc.project_id
)
SELECT
  'project_aggregate_mismatch' AS blocker_type,
  p.id AS project_id,
  p.title,
  p.status,
  p.raised_amount,
  COALESCE(ct.completed_contributions_tokens, 0) AS completed_contributions_tokens,
  p.raised_amount - COALESCE(ct.completed_contributions_tokens, 0) AS raised_amount_difference,
  p.backers_count,
  COALESCE(ct.completed_backers_count, 0) AS completed_backers_count,
  p.backers_count - COALESCE(ct.completed_backers_count, 0) AS backers_count_difference
FROM public.projects p
LEFT JOIN contribution_totals ct ON ct.project_id = p.id
WHERE p.raised_amount IS DISTINCT FROM COALESCE(ct.completed_contributions_tokens, 0)
   OR p.backers_count IS DISTINCT FROM COALESCE(ct.completed_backers_count, 0)
ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC;

-- 3. Cancelled projects where completed contributions do not match refunds.
WITH contribution_totals AS (
  SELECT
    pc.project_id,
    COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::integer AS completed_contributions_tokens
  FROM public.project_contributions pc
  GROUP BY pc.project_id
), refund_totals AS (
  SELECT
    r.project_id,
    COALESCE(SUM(r.amount), 0)::integer AS refunded_tokens
  FROM public.refunds r
  WHERE r.status = 'completed'
  GROUP BY r.project_id
)
SELECT
  'cancelled_project_refund_mismatch' AS blocker_type,
  p.id AS project_id,
  p.title,
  p.status,
  COALESCE(ct.completed_contributions_tokens, 0) AS completed_contributions_tokens,
  COALESCE(rt.refunded_tokens, 0) AS refunded_tokens,
  COALESCE(ct.completed_contributions_tokens, 0) - COALESCE(rt.refunded_tokens, 0) AS difference
FROM public.projects p
LEFT JOIN contribution_totals ct ON ct.project_id = p.id
LEFT JOIN refund_totals rt ON rt.project_id = p.id
WHERE p.status = 'cancelled'
  AND COALESCE(ct.completed_contributions_tokens, 0) <> COALESCE(rt.refunded_tokens, 0)
ORDER BY ABS(COALESCE(ct.completed_contributions_tokens, 0) - COALESCE(rt.refunded_tokens, 0)) DESC;

-- 4. Paid token purchases without matching purchase token transaction.
SELECT
  'paid_purchase_without_purchase_transaction' AS blocker_type,
  tp.id AS purchase_id,
  au.email,
  tp.user_id,
  tp.amount,
  tp.status,
  tp.payment_method,
  tp.payment_type,
  tp.created_at,
  tp.updated_at
FROM public.token_purchases tp
LEFT JOIN auth.users au ON au.id = tp.user_id
WHERE tp.status = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM public.token_transactions tt
    WHERE tt.reference_id = tp.id
      AND tt.transaction_type = 'purchase'
      AND tt.amount = tp.amount
  )
ORDER BY tp.updated_at DESC;

-- 5. Duplicate purchase transactions for the same purchase reference.
SELECT
  'duplicate_purchase_transactions' AS blocker_type,
  tt.reference_id,
  au.email,
  tt.user_id,
  COUNT(*) AS transactions_count,
  COALESCE(SUM(tt.amount), 0)::integer AS total_amount
FROM public.token_transactions tt
LEFT JOIN auth.users au ON au.id = tt.user_id
WHERE tt.transaction_type = 'purchase'
  AND tt.reference_id IS NOT NULL
GROUP BY tt.reference_id, au.email, tt.user_id
HAVING COUNT(*) > 1
ORDER BY transactions_count DESC;
