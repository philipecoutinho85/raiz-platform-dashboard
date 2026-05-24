-- Harden EXECUTE grants on critical SECURITY DEFINER functions.
--
-- Context:
-- Audit found critical functions exposed through broad PUBLIC/anon execution privileges.
-- SECURITY DEFINER functions execute with elevated privileges and must not be executable by broad roles.
--
-- Strategy:
-- 1. Revoke EXECUTE from PUBLIC and anon for critical functions.
-- 2. Grant authenticated only where user/admin frontend legitimately calls the RPC and function has internal checks.
-- 3. Grant service_role for internal Stripe/webhook/maintenance functions.
-- 4. Do not alter function logic or data.

-- Admin-only/user-authenticated RPCs with internal authorization checks.
REVOKE EXECUTE ON FUNCTION public.admin_adjust_user_tokens(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_tokens(uuid, integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_get_users_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_users_overview() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cancel_project_and_refund_tokens_atomic(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_project_and_refund_tokens_atomic(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.log_admin_access(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_access(uuid, text, text, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, uuid, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, uuid, jsonb, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.process_admin_refund_atomic(uuid, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_admin_refund_atomic(uuid, text, text, text, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.resolve_operational_exception(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_operational_exception(text, uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.soft_delete_ledger_entry(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_ledger_entry(uuid, text, boolean) TO authenticated, service_role;

-- User-facing authenticated RPCs.
REVOKE EXECUTE ON FUNCTION public.support_project_with_tokens(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_project_with_tokens(uuid, integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reconcile_user_token_balance(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_user_token_balance(uuid, text) TO authenticated, service_role;

-- Maintenance/admin functions.
REVOKE EXECUTE ON FUNCTION public.recalculate_all_project_aggregates() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_project_aggregates() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.recalculate_project_aggregates(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_project_aggregates(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.release_grace_period_funds() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_grace_period_funds() TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_financial_alert(text, text, text, text, uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_financial_alert(text, text, text, text, uuid, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) TO service_role;

-- Stripe/webhook/internal functions.
REVOKE EXECUTE ON FUNCTION public.create_ledger_entry(uuid, uuid, uuid, uuid, integer, numeric, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ledger_entry(uuid, uuid, uuid, uuid, integer, numeric, text, numeric, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fail_token_purchase_if_unpaid(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_token_purchase_if_unpaid(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_stripe_event_processed(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_stripe_event_processed(text, text, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_stripe_dispute_atomic(text, text, text, text, text, text, integer, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_dispute_atomic(text, text, text, text, text, text, integer, text, text, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_project_payment_atomic(text, text, uuid, uuid, text, integer, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_token_purchase_atomic(uuid, uuid, integer, text, text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_token_purchase_atomic(uuid, uuid, integer, text, text, text, timestamptz, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_stripe_event_once(text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_stripe_event_once(text, text, text, text, jsonb) TO service_role;
