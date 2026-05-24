-- Critical function EXECUTE grants summary.
-- Read-only.
-- Purpose: show only sensitive SECURITY DEFINER functions exposed to broad roles.
--
-- Interpretation:
-- - anon/public on critical functions: generally blocker unless intentionally public and internally safe.
-- - authenticated on admin/stripe/internal functions: review required unless function performs strict authorization internally.
-- - authenticated on user-facing functions may be expected, but still needs internal auth checks.

WITH critical_functions AS (
  SELECT * FROM (VALUES
    ('admin_adjust_user_tokens', 'admin_only'),
    ('admin_get_users_overview', 'admin_only'),
    ('cancel_project_and_refund_tokens_atomic', 'admin_only'),
    ('create_financial_alert', 'internal_or_admin'),
    ('create_ledger_entry', 'internal_stripe'),
    ('fail_token_purchase_if_unpaid', 'internal_stripe'),
    ('log_admin_access', 'admin_only'),
    ('log_admin_action', 'admin_only'),
    ('mark_stripe_event_processed', 'internal_stripe'),
    ('process_admin_refund_atomic', 'admin_only'),
    ('process_stripe_dispute_atomic', 'internal_stripe'),
    ('process_stripe_project_payment_atomic', 'internal_stripe'),
    ('process_token_purchase_atomic', 'internal_stripe'),
    ('recalculate_all_project_aggregates', 'admin_or_maintenance'),
    ('recalculate_project_aggregates', 'admin_or_maintenance'),
    ('reconcile_user_token_balance', 'admin_or_self_with_strict_check'),
    ('record_operational_exception', 'internal_or_admin'),
    ('record_stripe_event_once', 'internal_stripe'),
    ('release_grace_period_funds', 'internal_or_admin'),
    ('resolve_operational_exception', 'admin_only'),
    ('soft_delete_ledger_entry', 'admin_only'),
    ('support_project_with_tokens', 'user_facing_authenticated')
  ) AS t(function_name, expected_exposure)
), grants AS (
  SELECT
    cf.function_name,
    cf.expected_exposure,
    n.nspname AS schema_name,
    p.oid,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    grantee.rolname AS grantee
  FROM critical_functions cf
  JOIN pg_proc p ON p.proname = cf.function_name
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  JOIN pg_roles grantee ON has_function_privilege(grantee.oid, p.oid, 'EXECUTE')
  WHERE grantee.rolname IN ('anon', 'public', 'authenticated')
)
SELECT
  function_name,
  expected_exposure,
  arguments,
  grantee,
  CASE
    WHEN grantee IN ('anon', 'public') THEN 'blocker_broad_public_execute'
    WHEN expected_exposure IN ('admin_only', 'internal_stripe', 'internal_or_admin', 'admin_or_maintenance') AND grantee = 'authenticated' THEN 'review_authenticated_execute'
    WHEN expected_exposure = 'admin_or_self_with_strict_check' AND grantee = 'authenticated' THEN 'review_internal_strict_check_required'
    WHEN expected_exposure = 'user_facing_authenticated' AND grantee = 'authenticated' THEN 'expected_if_internal_checks_exist'
    ELSE 'review'
  END AS risk_status
FROM grants
ORDER BY risk_status, function_name, grantee;

-- Compact count by risk status.
WITH critical_functions AS (
  SELECT * FROM (VALUES
    ('admin_adjust_user_tokens', 'admin_only'),
    ('admin_get_users_overview', 'admin_only'),
    ('cancel_project_and_refund_tokens_atomic', 'admin_only'),
    ('create_financial_alert', 'internal_or_admin'),
    ('create_ledger_entry', 'internal_stripe'),
    ('fail_token_purchase_if_unpaid', 'internal_stripe'),
    ('log_admin_access', 'admin_only'),
    ('log_admin_action', 'admin_only'),
    ('mark_stripe_event_processed', 'internal_stripe'),
    ('process_admin_refund_atomic', 'admin_only'),
    ('process_stripe_dispute_atomic', 'internal_stripe'),
    ('process_stripe_project_payment_atomic', 'internal_stripe'),
    ('process_token_purchase_atomic', 'internal_stripe'),
    ('recalculate_all_project_aggregates', 'admin_or_maintenance'),
    ('recalculate_project_aggregates', 'admin_or_maintenance'),
    ('reconcile_user_token_balance', 'admin_or_self_with_strict_check'),
    ('record_operational_exception', 'internal_or_admin'),
    ('record_stripe_event_once', 'internal_stripe'),
    ('release_grace_period_funds', 'internal_or_admin'),
    ('resolve_operational_exception', 'admin_only'),
    ('soft_delete_ledger_entry', 'admin_only'),
    ('support_project_with_tokens', 'user_facing_authenticated')
  ) AS t(function_name, expected_exposure)
), grants AS (
  SELECT
    cf.function_name,
    cf.expected_exposure,
    grantee.rolname AS grantee
  FROM critical_functions cf
  JOIN pg_proc p ON p.proname = cf.function_name
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  JOIN pg_roles grantee ON has_function_privilege(grantee.oid, p.oid, 'EXECUTE')
  WHERE grantee.rolname IN ('anon', 'public', 'authenticated')
), classified AS (
  SELECT
    CASE
      WHEN grantee IN ('anon', 'public') THEN 'blocker_broad_public_execute'
      WHEN expected_exposure IN ('admin_only', 'internal_stripe', 'internal_or_admin', 'admin_or_maintenance') AND grantee = 'authenticated' THEN 'review_authenticated_execute'
      WHEN expected_exposure = 'admin_or_self_with_strict_check' AND grantee = 'authenticated' THEN 'review_internal_strict_check_required'
      WHEN expected_exposure = 'user_facing_authenticated' AND grantee = 'authenticated' THEN 'expected_if_internal_checks_exist'
      ELSE 'review'
    END AS risk_status
  FROM grants
)
SELECT risk_status, COUNT(*) AS functions_count
FROM classified
GROUP BY risk_status
ORDER BY functions_count DESC, risk_status;
