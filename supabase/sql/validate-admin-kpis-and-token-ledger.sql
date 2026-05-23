-- Admin KPI and token ledger validation script.
-- Read-only.
-- Purpose: validate admin dashboard counters and token ledger consistency after financial/lifecycle changes.

-- 1. Project status distribution.
SELECT
  status,
  COUNT(*) AS projects_count,
  COALESCE(SUM(raised_amount), 0)::integer AS raised_tokens_total,
  COALESCE(SUM(backers_count), 0)::integer AS backers_total
FROM public.projects
GROUP BY status
ORDER BY status;

-- 2. Dashboard KPI expected values.
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') AS active_projects,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_approval,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_projects,
  COUNT(*) FILTER (WHERE status = 'archived') AS archived_projects,
  COUNT(*) FILTER (WHERE status = 'deleted') AS deleted_projects,
  COUNT(*) AS all_projects
FROM public.projects;

-- 3. Token wallet vs token transaction ledger by user.
WITH ledger AS (
  SELECT
    tt.user_id,
    COALESCE(SUM(tt.amount), 0)::integer AS ledger_balance
  FROM public.token_transactions tt
  GROUP BY tt.user_id
)
SELECT
  au.email,
  COALESCE(ut.balance, 0) AS wallet_balance,
  COALESCE(l.ledger_balance, 0) AS ledger_balance,
  COALESCE(ut.balance, 0) - COALESCE(l.ledger_balance, 0) AS difference,
  ut.updated_at
FROM public.user_tokens ut
LEFT JOIN auth.users au ON au.id = ut.user_id
LEFT JOIN ledger l ON l.user_id = ut.user_id
ORDER BY ABS(COALESCE(ut.balance, 0) - COALESCE(l.ledger_balance, 0)) DESC, au.email;

-- 4. Global token consistency.
WITH ledger AS (
  SELECT COALESCE(SUM(amount), 0)::integer AS ledger_total
  FROM public.token_transactions
), wallets AS (
  SELECT COALESCE(SUM(balance), 0)::integer AS wallet_total
  FROM public.user_tokens
)
SELECT
  wallets.wallet_total,
  ledger.ledger_total,
  wallets.wallet_total - ledger.ledger_total AS difference
FROM wallets, ledger;

-- 5. Contributions/refunds by project, useful for cancelled projects.
SELECT
  p.id,
  p.title,
  p.status,
  p.raised_amount,
  p.backers_count,
  COUNT(pc.id) FILTER (WHERE pc.status = 'completed') AS completed_contributions_count,
  COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::integer AS completed_contributions_tokens,
  COUNT(r.id) AS refunds_count,
  COALESCE(SUM(r.amount), 0)::integer AS refunded_tokens
FROM public.projects p
LEFT JOIN public.project_contributions pc ON pc.project_id = p.id
LEFT JOIN public.refunds r ON r.project_id = p.id
GROUP BY p.id, p.title, p.status, p.raised_amount, p.backers_count
ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC;
