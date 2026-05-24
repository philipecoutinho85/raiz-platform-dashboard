-- SECURITY DEFINER execute grants audit script.
-- Read-only.
-- Purpose: identify SECURITY DEFINER functions exposed to broad roles.
--
-- Risk model:
-- SECURITY DEFINER functions are not unsafe by themselves.
-- They become risky when EXECUTE is granted broadly and the function does not perform strict auth/role checks internally.

-- 1. All SECURITY DEFINER functions in public schema.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS returns,
  p.provolatile AS volatility,
  CASE WHEN p.prosecdef THEN 'security_definer' ELSE 'security_invoker' END AS security_mode
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname, arguments;

-- 2. Explicit EXECUTE grants for SECURITY DEFINER functions.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  grantee.rolname AS grantee,
  has_function_privilege(grantee.oid, p.oid, 'EXECUTE') AS can_execute,
  CASE
    WHEN grantee.rolname IN ('anon', 'public') THEN 'high_risk_broad_execute'
    WHEN grantee.rolname = 'authenticated' THEN 'review_required_authenticated_execute'
    ELSE 'specific_role_or_owner'
  END AS risk_level
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles grantee ON has_function_privilege(grantee.oid, p.oid, 'EXECUTE')
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND grantee.rolname IN ('anon', 'authenticated', 'public', 'service_role')
ORDER BY risk_level, p.proname, grantee.rolname;

-- 3. Critical SECURITY DEFINER functions exposed to anon/public/authenticated.
WITH critical_functions AS (
  SELECT unnest(ARRAY[
    'admin_adjust_user_tokens',
    'admin_get_users_overview',
    'cancel_project_and_refund_tokens_atomic',
    'create_financial_alert',
    'create_ledger_entry',
    'fail_token_purchase_if_unpaid',
    'log_admin_access',
    'log_admin_action',
    'mark_stripe_event_processed',
    'process_admin_refund_atomic',
    'process_stripe_dispute_atomic',
    'process_stripe_project_payment_atomic',
    'process_token_purchase_atomic',
    'recalculate_all_project_aggregates',
    'recalculate_project_aggregates',
    'reconcile_user_token_balance',
    'record_operational_exception',
    'record_stripe_event_once',
    'release_grace_period_funds',
    'resolve_operational_exception',
    'soft_delete_ledger_entry',
    'support_project_with_tokens'
  ]) AS function_name
)
SELECT
  'critical_function_broad_execute' AS issue_type,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  grantee.rolname AS grantee,
  CASE
    WHEN grantee.rolname IN ('anon', 'public') THEN 'blocker_if_not_intentional'
    WHEN grantee.rolname = 'authenticated' THEN 'requires_internal_authz_review'
    ELSE 'review'
  END AS severity
FROM critical_functions cf
JOIN pg_proc p ON p.proname = cf.function_name
JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
JOIN pg_roles grantee ON has_function_privilege(grantee.oid, p.oid, 'EXECUTE')
WHERE grantee.rolname IN ('anon', 'authenticated', 'public')
ORDER BY severity, function_name, grantee;

-- 4. SECURITY DEFINER functions without explicit search_path pinned in definition.
-- Note: function source check is heuristic. It flags functions that may need review.
SELECT
  'security_definer_search_path_review' AS issue_type,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE
    WHEN array_to_string(p.proconfig, ',') ILIKE '%search_path%' THEN 'search_path_configured'
    ELSE 'review_missing_search_path_config'
  END AS status,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY status DESC, p.proname;
