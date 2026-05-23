-- Disable legacy project cancellation refund trigger.
--
-- Root cause:
-- Legacy trigger `process_refunds_on_project_cancel` on public.projects attempts to process token refunds
-- whenever project.status changes to `cancelled`.
--
-- This conflicts with the current audited cancellation flow:
-- `cancel_project_and_refund_tokens_atomic`, which is the single source of truth for:
-- 1. project status update;
-- 2. wallet locking;
-- 3. token refunding;
-- 4. token_transactions insertion;
-- 5. refunds insertion;
-- 6. lifecycle/admin logging.
--
-- The legacy trigger used project id as token_transactions.reference_id and transaction_type `refund`,
-- causing duplicate/refund constraint failures such as:
-- `duplicate key value violates unique constraint idx_token_refund_transaction_once`.

DROP TRIGGER IF EXISTS process_refunds_on_project_cancel ON public.projects;
DROP TRIGGER IF EXISTS process_refunds_on_project_cancel ON projects;

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

COMMENT ON FUNCTION public.process_refunds_on_project_cancel() IS
'Deprecated no-op. Project cancellation refunds must be processed exclusively by cancel_project_and_refund_tokens_atomic.';

-- Optional defensive neutralization for delete-time refund function if it exists.
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

COMMENT ON FUNCTION public.refund_tokens_on_project_delete() IS
'Deprecated no-op. Projects with financial history must be cancelled/archived, not physically deleted.';
