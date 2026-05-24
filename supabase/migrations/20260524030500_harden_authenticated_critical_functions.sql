-- Harden authenticated critical SECURITY DEFINER functions.
--
-- Context:
-- Audit identified critical functions executable by authenticated users without clear internal authorization checks.
-- This migration reduces exposure without changing application data.
--
-- Strategy:
-- - Add explicit admin checks where frontend/admin legitimately calls the RPC.
-- - Restrict maintenance/internal functions to service_role.
-- - Keep reconcile_user_token_balance unchanged because it already checks auth.uid() + has_role(admin).

-- 1. Harden admin log action: caller must be authenticated admin and must log as themselves.
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid DEFAULT NULL::uuid,
  p_details jsonb DEFAULT NULL::jsonb,
  p_ip_address text DEFAULT NULL::text,
  p_user_agent text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_current_user uuid := auth.uid();
BEGIN
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_admin_id IS DISTINCT FROM v_current_user THEN
    RAISE EXCEPTION 'Admin id mismatch';
  END IF;

  IF NOT public.has_role(v_current_user, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  INSERT INTO public.admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_admin_id,
    COALESCE(NULLIF(trim(p_action), ''), 'unknown_action'),
    COALESCE(NULLIF(trim(p_target_type), ''), 'unknown_target'),
    p_target_id,
    COALESCE(p_details, '{}'::jsonb),
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, uuid, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, text, uuid, jsonb, text, text) TO authenticated, service_role;

-- 2. Harden operational exception resolution: admin only.
CREATE OR REPLACE FUNCTION public.resolve_operational_exception(
  p_source text,
  p_source_id uuid,
  p_reason text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user uuid := auth.uid();
BEGIN
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(v_current_user, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  UPDATE public.operational_exception_queue
  SET status = 'resolved',
      resolved_at = now(),
      resolved_by = v_current_user,
      updated_at = now()
  WHERE source = p_source
    AND source_id = p_source_id
    AND (p_reason IS NULL OR reason = p_reason)
    AND status <> 'resolved';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_operational_exception(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_operational_exception(text, uuid, text) TO authenticated, service_role;

-- 3. Restrict maintenance/internal functions to service_role only.
REVOKE EXECUTE ON FUNCTION public.recalculate_all_project_aggregates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_project_aggregates() TO service_role;

REVOKE EXECUTE ON FUNCTION public.recalculate_project_aggregates(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_project_aggregates(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_financial_alert(text, text, text, text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_financial_alert(text, text, text, text, uuid, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) TO service_role;
