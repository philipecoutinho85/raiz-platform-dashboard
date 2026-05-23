-- Purge legacy project refund triggers.
--
-- Purpose:
-- Remove any remaining legacy trigger attached to public.projects that attempts to process
-- refunds/token refunds automatically during UPDATE or DELETE.
--
-- The audited source of truth for project cancellation/refund is:
-- public.cancel_project_and_refund_tokens_atomic(uuid, text)
--
-- Legacy triggers caused duplicate refund attempts and errors such as:
-- duplicate key value violates unique constraint idx_token_refund_transaction_once

DO $$
DECLARE
  v_trigger record;
BEGIN
  FOR v_trigger IN
    SELECT
      t.tgname AS trigger_name,
      pg_get_triggerdef(t.oid) AS trigger_definition
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'projects'
      AND NOT t.tgisinternal
      AND (
        lower(t.tgname) LIKE '%refund%'
        OR lower(t.tgname) LIKE '%reembolso%'
        OR lower(t.tgname) LIKE '%cancel%'
        OR lower(pg_get_triggerdef(t.oid)) LIKE '%refund%'
        OR lower(pg_get_triggerdef(t.oid)) LIKE '%reembolso%'
        OR lower(pg_get_triggerdef(t.oid)) LIKE '%token%'
        OR lower(pg_get_triggerdef(t.oid)) LIKE '%process_refunds%'
        OR lower(pg_get_triggerdef(t.oid)) LIKE '%refund_tokens%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.projects', v_trigger.trigger_name);
    RAISE NOTICE 'Dropped legacy project trigger: % / %', v_trigger.trigger_name, v_trigger.trigger_definition;
  END LOOP;
END $$;

-- Explicit known legacy trigger names from older migrations.
DROP TRIGGER IF EXISTS process_refunds_on_project_cancel ON public.projects;
DROP TRIGGER IF EXISTS refund_tokens_on_project_delete ON public.projects;
DROP TRIGGER IF EXISTS trigger_refund_tokens_on_project_delete ON public.projects;
DROP TRIGGER IF EXISTS trigger_process_refunds_on_project_cancel ON public.projects;
DROP TRIGGER IF EXISTS on_project_cancel_refund_tokens ON public.projects;
DROP TRIGGER IF EXISTS on_project_delete_refund_tokens ON public.projects;

-- Neutralize known legacy functions defensively.
CREATE OR REPLACE FUNCTION public.process_refunds_on_project_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'process_refunds_on_project_cancel is deprecated and intentionally disabled. Use cancel_project_and_refund_tokens_atomic instead.';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_automatic_refunds_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'process_automatic_refunds_on_cancel is deprecated and intentionally disabled. Use cancel_project_and_refund_tokens_atomic instead.';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_tokens_on_project_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'refund_tokens_on_project_delete is deprecated and intentionally disabled. Projects with financial history must not be physically deleted.';
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.process_refunds_on_project_cancel() IS
'Deprecated no-op. Project cancellation refunds must be processed exclusively by cancel_project_and_refund_tokens_atomic.';

COMMENT ON FUNCTION public.process_automatic_refunds_on_cancel() IS
'Deprecated no-op. Project cancellation refunds must be processed exclusively by cancel_project_and_refund_tokens_atomic.';

COMMENT ON FUNCTION public.refund_tokens_on_project_delete() IS
'Deprecated no-op. Projects with financial history must be cancelled/archived, not physically deleted.';
