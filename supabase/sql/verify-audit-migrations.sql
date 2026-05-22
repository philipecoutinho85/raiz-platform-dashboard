-- Audit migration verification script.
-- Purpose: run this in Supabase SQL Editor after applying migrations.
-- This script is read-only and does not mutate production data.

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'payment_dispute_records',
    'user_risk_flags',
    'project_lifecycle_events',
    'operational_exception_queue'
  ]) AS table_name
), table_checks AS (
  SELECT
    et.table_name,
    CASE WHEN t.table_name IS NULL THEN 'missing' ELSE 'ok' END AS status
  FROM expected_tables et
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public'
   AND t.table_name = et.table_name
), expected_functions AS (
  SELECT unnest(ARRAY[
    'process_stripe_dispute_atomic',
    'record_stripe_event_once',
    'cancel_project_and_refund_tokens_atomic',
    'support_project_with_tokens',
    'record_operational_exception',
    'resolve_operational_exception'
  ]) AS function_name
), function_checks AS (
  SELECT
    ef.function_name,
    CASE WHEN p.proname IS NULL THEN 'missing' ELSE 'ok' END AS status
  FROM expected_functions ef
  LEFT JOIN pg_proc p
    ON p.proname = ef.function_name
  LEFT JOIN pg_namespace n
    ON n.oid = p.pronamespace
   AND n.nspname = 'public'
), expected_policies AS (
  SELECT * FROM (VALUES
    ('payment_dispute_records', 'Admins can view payment dispute records'),
    ('user_risk_flags', 'Admins can view user risk flags'),
    ('user_risk_flags', 'Users can view own risk flags'),
    ('project_lifecycle_events', 'Admins can view lifecycle events'),
    ('operational_exception_queue', 'Admins can view operational exception queue')
  ) AS p(table_name, policy_name)
), policy_checks AS (
  SELECT
    ep.table_name || ' / ' || ep.policy_name AS policy_name,
    CASE WHEN pol.policyname IS NULL THEN 'missing' ELSE 'ok' END AS status
  FROM expected_policies ep
  LEFT JOIN pg_policies pol
    ON pol.schemaname = 'public'
   AND pol.tablename = ep.table_name
   AND pol.policyname = ep.policy_name
), expected_indexes AS (
  SELECT unnest(ARRAY[
    'idx_payment_disputes_user_id',
    'idx_payment_disputes_purchase_id',
    'idx_payment_disputes_project_id',
    'idx_payment_disputes_payment_intent',
    'idx_user_risk_flags_user_status',
    'idx_project_lifecycle_project',
    'idx_operational_exception_queue_status',
    'idx_operational_exception_queue_retry'
  ]) AS index_name
), index_checks AS (
  SELECT
    ei.index_name,
    CASE WHEN c.relname IS NULL THEN 'missing' ELSE 'ok' END AS status
  FROM expected_indexes ei
  LEFT JOIN pg_class c
    ON c.relname = ei.index_name
  LEFT JOIN pg_namespace n
    ON n.oid = c.relnamespace
   AND n.nspname = 'public'
  WHERE c.relkind IS NULL OR c.relkind = 'i'
)
SELECT 'table' AS check_type, table_name AS object_name, status FROM table_checks
UNION ALL
SELECT 'function' AS check_type, function_name AS object_name, status FROM function_checks
UNION ALL
SELECT 'policy' AS check_type, policy_name AS object_name, status FROM policy_checks
UNION ALL
SELECT 'index' AS check_type, index_name AS object_name, status FROM index_checks
ORDER BY check_type, object_name;

-- Expected result: every row should return status = 'ok'.
-- If any row returns 'missing', the corresponding migration/function/policy/index is not applied in the target database.
