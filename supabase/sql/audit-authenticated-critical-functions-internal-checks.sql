-- Authenticated critical function internal checks audit.
-- Read-only.
-- Purpose: review SECURITY DEFINER functions that remain executable by authenticated users.
--
-- Interpretation:
-- - authenticated access can be correct for user-facing/admin RPCs, but the function body must check auth.uid(), has_role(), ownership, admin_type, or equivalent.
-- - internal Stripe/webhook functions should normally not be executable by authenticated users.

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
), function_data AS (
  SELECT
    cf.function_name,
    cf.expected_exposure,
    p.oid,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
  FROM critical_functions cf
  JOIN pg_proc p ON p.proname = cf.function_name
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  JOIN pg_roles authenticated_role ON authenticated_role.rolname = 'authenticated'
  WHERE has_function_privilege(authenticated_role.oid, p.oid, 'EXECUTE')
)
SELECT
  function_name,
  expected_exposure,
  arguments,
  CASE
    WHEN definition ILIKE '%auth.uid()%' THEN true
    ELSE false
  END AS checks_auth_uid,
  CASE
    WHEN definition ILIKE '%has_role%' THEN true
    ELSE false
  END AS checks_has_role,
  CASE
    WHEN definition ILIKE '%admin_type%' THEN true
    ELSE false
  END AS checks_admin_type,
  CASE
    WHEN definition ILIKE '%user_id%' THEN true
    ELSE false
  END AS references_user_id,
  CASE
    WHEN definition ILIKE '%service_role%' THEN true
    ELSE false
  END AS references_service_role,
  CASE
    WHEN expected_exposure IN ('internal_stripe') THEN 'should_not_be_authenticated_executable'
    WHEN expected_exposure IN ('admin_only', 'internal_or_admin', 'admin_or_maintenance')
      AND (definition ILIKE '%has_role%' OR definition ILIKE '%admin_type%') THEN 'likely_ok_admin_checked'
    WHEN expected_exposure = 'admin_or_self_with_strict_check'
      AND definition ILIKE '%auth.uid()%'
      AND definition ILIKE '%user_id%' THEN 'review_owner_or_admin_logic'
    WHEN expected_exposure = 'user_facing_authenticated'
      AND definition ILIKE '%auth.uid()%' THEN 'likely_ok_user_facing'
    ELSE 'needs_manual_review_or_hardening'
  END AS review_status
FROM function_data
ORDER BY review_status, expected_exposure, function_name;

-- Compact summary.
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
), function_data AS (
  SELECT
    cf.function_name,
    cf.expected_exposure,
    pg_get_functiondef(p.oid) AS definition
  FROM critical_functions cf
  JOIN pg_proc p ON p.proname = cf.function_name
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  JOIN pg_roles authenticated_role ON authenticated_role.rolname = 'authenticated'
  WHERE has_function_privilege(authenticated_role.oid, p.oid, 'EXECUTE')
), classified AS (
  SELECT
    CASE
      WHEN expected_exposure IN ('internal_stripe') THEN 'should_not_be_authenticated_executable'
      WHEN expected_exposure IN ('admin_only', 'internal_or_admin', 'admin_or_maintenance')
        AND (definition ILIKE '%has_role%' OR definition ILIKE '%admin_type%') THEN 'likely_ok_admin_checked'
      WHEN expected_exposure = 'admin_or_self_with_strict_check'
        AND definition ILIKE '%auth.uid()%'
        AND definition ILIKE '%user_id%' THEN 'review_owner_or_admin_logic'
      WHEN expected_exposure = 'user_facing_authenticated'
        AND definition ILIKE '%auth.uid()%' THEN 'likely_ok_user_facing'
      ELSE 'needs_manual_review_or_hardening'
    END AS review_status
  FROM function_data
)
SELECT review_status, COUNT(*) AS functions_count
FROM classified
GROUP BY review_status
ORDER BY functions_count DESC, review_status;
