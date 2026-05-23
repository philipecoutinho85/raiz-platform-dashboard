-- Disable legacy refund trigger conflicting with atomic project cancellation.
--
-- Root cause:
-- `cancel_project_and_refund_tokens_atomic` is now the safe source of truth for project
-- cancellation and token refunds. It already:
-- 1. marks project as cancelled;
-- 2. locks affected wallets;
-- 3. credits refunded tokens;
-- 4. inserts token_transactions with transaction_type = 'project_refund';
-- 5. inserts refunds records as completed;
-- 6. writes project_lifecycle_events and admin_logs.
--
-- Legacy trigger `trigger_complete_refund` on public.refunds executes complete_refund(),
-- which can attempt to credit tokens again or create duplicate refund token_transactions,
-- causing unique constraint errors such as:
-- `idx_token_refund_transaction_once`.

DROP TRIGGER IF EXISTS trigger_complete_refund ON public.refunds;

-- Keep the legacy function name, but neutralize it defensively in case another trigger or manual call exists.
-- Refunds linked to project cancellation must be processed by cancel_project_and_refund_tokens_atomic.
CREATE OR REPLACE FUNCTION public.complete_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'complete_refund is deprecated and intentionally disabled. Use cancel_project_and_refund_tokens_atomic for project token refunds.';
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.complete_refund() IS
'Deprecated no-op. Project cancellation refunds must be processed exclusively by cancel_project_and_refund_tokens_atomic.';
