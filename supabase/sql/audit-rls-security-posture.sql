-- RLS security posture audit script.
-- Read-only.
-- Purpose: identify risky RLS/policy configuration on critical production tables.
--
-- This script does not modify data or policies.

-- 1. RLS status for critical public tables.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  CASE
    WHEN c.relrowsecurity THEN 'ok_rls_enabled'
    ELSE 'risk_rls_disabled'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
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
ORDER BY status DESC, table_name;

-- 2. Policies on critical public tables.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
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
ORDER BY tablename, cmd, policyname;

-- 3. Critical tables with RLS enabled but no policies.
WITH critical_tables AS (
  SELECT unnest(ARRAY[
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
  ]) AS table_name
), rls AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
), policy_counts AS (
  SELECT
    tablename AS table_name,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT
  ct.table_name,
  COALESCE(rls.rls_enabled, false) AS rls_enabled,
  COALESCE(pc.policy_count, 0) AS policy_count,
  CASE
    WHEN rls.table_name IS NULL THEN 'missing_table_or_not_public_table'
    WHEN COALESCE(rls.rls_enabled, false) = false THEN 'risk_rls_disabled'
    WHEN COALESCE(pc.policy_count, 0) = 0 THEN 'risk_no_policies'
    ELSE 'ok'
  END AS status
FROM critical_tables ct
LEFT JOIN rls ON rls.table_name = ct.table_name
LEFT JOIN policy_counts pc ON pc.table_name = ct.table_name
ORDER BY status DESC, ct.table_name;

-- 4. Policies that may be broad because they include anon/public access.
SELECT
  'potential_public_policy' AS issue_type,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    roles::text ILIKE '%anon%'
    OR roles::text ILIKE '%public%'
  )
ORDER BY tablename, policyname;

-- 5. SECURITY DEFINER functions in public schema.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE WHEN p.prosecdef THEN 'security_definer' ELSE 'security_invoker' END AS security_mode,
  pg_get_function_result(p.oid) AS returns,
  p.provolatile AS volatility
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
