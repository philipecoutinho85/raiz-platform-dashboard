-- RLS blockers summary audit script.
-- Read-only.
-- Purpose: summarize RLS risks on critical production tables.
--
-- Interpretation:
-- - risk_rls_disabled: blocker for sensitive tables.
-- - risk_no_policies: RLS enabled but no policies; may block app functionality or indicate incomplete config.
-- - potential_public_policy: review required, especially for financial/admin tables.

WITH critical_tables AS (
  SELECT * FROM (VALUES
    ('profiles', 'user_data'),
    ('user_roles', 'admin_security'),
    ('user_tokens', 'financial'),
    ('token_transactions', 'financial'),
    ('token_purchases', 'financial'),
    ('projects', 'marketplace'),
    ('project_contributions', 'financial'),
    ('refunds', 'financial'),
    ('admin_logs', 'admin_security'),
    ('project_lifecycle_events', 'admin_audit'),
    ('notifications', 'user_data'),
    ('support_conversations', 'support'),
    ('support_messages', 'support'),
    ('payment_dispute_records', 'financial_risk'),
    ('operational_exception_queue', 'operations'),
    ('user_risk_flags', 'financial_risk'),
    ('creator_payouts', 'financial')
  ) AS t(table_name, risk_domain)
), rls_status AS (
  SELECT
    ct.table_name,
    ct.risk_domain,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM critical_tables ct
  LEFT JOIN pg_class c ON c.relname = ct.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  WHERE c.oid IS NULL OR n.nspname = 'public'
), policy_counts AS (
  SELECT
    tablename AS table_name,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
), rls_blockers AS (
  SELECT
    CASE
      WHEN rs.rls_enabled IS NULL THEN 'missing_table_or_not_public_table'
      WHEN rs.rls_enabled = false THEN 'risk_rls_disabled'
      WHEN COALESCE(pc.policy_count, 0) = 0 THEN 'risk_no_policies'
      ELSE 'ok'
    END AS issue_type,
    rs.table_name,
    rs.risk_domain
  FROM rls_status rs
  LEFT JOIN policy_counts pc ON pc.table_name = rs.table_name
), public_policy_blockers AS (
  SELECT
    'potential_public_policy' AS issue_type,
    pp.tablename AS table_name,
    COALESCE(ct.risk_domain, 'unknown') AS risk_domain
  FROM pg_policies pp
  LEFT JOIN critical_tables ct ON ct.table_name = pp.tablename
  WHERE pp.schemaname = 'public'
    AND pp.tablename IN (SELECT table_name FROM critical_tables)
    AND (
      pp.roles::text ILIKE '%anon%'
      OR pp.roles::text ILIKE '%public%'
    )
)
SELECT
  issue_type,
  risk_domain,
  COUNT(*) AS issue_count
FROM (
  SELECT issue_type, risk_domain FROM rls_blockers WHERE issue_type <> 'ok'
  UNION ALL
  SELECT issue_type, risk_domain FROM public_policy_blockers
) issues
GROUP BY issue_type, risk_domain
ORDER BY issue_count DESC, issue_type, risk_domain;

-- Detailed rows for any non-ok RLS status.
WITH critical_tables AS (
  SELECT * FROM (VALUES
    ('profiles', 'user_data'),
    ('user_roles', 'admin_security'),
    ('user_tokens', 'financial'),
    ('token_transactions', 'financial'),
    ('token_purchases', 'financial'),
    ('projects', 'marketplace'),
    ('project_contributions', 'financial'),
    ('refunds', 'financial'),
    ('admin_logs', 'admin_security'),
    ('project_lifecycle_events', 'admin_audit'),
    ('notifications', 'user_data'),
    ('support_conversations', 'support'),
    ('support_messages', 'support'),
    ('payment_dispute_records', 'financial_risk'),
    ('operational_exception_queue', 'operations'),
    ('user_risk_flags', 'financial_risk'),
    ('creator_payouts', 'financial')
  ) AS t(table_name, risk_domain)
), rls_status AS (
  SELECT
    ct.table_name,
    ct.risk_domain,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM critical_tables ct
  LEFT JOIN pg_class c ON c.relname = ct.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  WHERE c.oid IS NULL OR n.nspname = 'public'
), policy_counts AS (
  SELECT
    tablename AS table_name,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT
  rs.table_name,
  rs.risk_domain,
  COALESCE(rs.rls_enabled, false) AS rls_enabled,
  COALESCE(rs.rls_forced, false) AS rls_forced,
  COALESCE(pc.policy_count, 0) AS policy_count,
  CASE
    WHEN rs.rls_enabled IS NULL THEN 'missing_table_or_not_public_table'
    WHEN rs.rls_enabled = false THEN 'risk_rls_disabled'
    WHEN COALESCE(pc.policy_count, 0) = 0 THEN 'risk_no_policies'
    ELSE 'ok'
  END AS status
FROM rls_status rs
LEFT JOIN policy_counts pc ON pc.table_name = rs.table_name
WHERE rs.rls_enabled IS NULL
   OR rs.rls_enabled = false
   OR COALESCE(pc.policy_count, 0) = 0
ORDER BY status, risk_domain, table_name;

-- Detailed potentially public policies.
SELECT
  'potential_public_policy' AS issue_type,
  pp.tablename,
  pp.policyname,
  pp.roles,
  pp.cmd,
  pp.qual,
  pp.with_check
FROM pg_policies pp
WHERE pp.schemaname = 'public'
  AND pp.tablename IN (
    'profiles',
    'user_roles',
    'user_tokens',
    'token_transactions',
    'token_purchases',
    'projects',
    'project_contributions',
    'refunds',
    'admin_logs',
    'project_lifecycle_events',
    'notifications',
    'support_conversations',
    'support_messages',
    'payment_dispute_records',
    'operational_exception_queue',
    'user_risk_flags',
    'creator_payouts'
  )
  AND (
    pp.roles::text ILIKE '%anon%'
    OR pp.roles::text ILIKE '%public%'
  )
ORDER BY pp.tablename, pp.policyname;
