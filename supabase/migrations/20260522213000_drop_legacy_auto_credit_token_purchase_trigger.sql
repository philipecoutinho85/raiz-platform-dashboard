-- Drop legacy auto-credit trigger for token purchases.
--
-- Root cause:
-- `process_token_purchase_atomic` is now the single source of truth for token purchase processing.
-- It already:
-- 1. validates the purchase;
-- 2. locks the wallet;
-- 3. updates public.user_tokens.balance;
-- 4. inserts public.token_transactions;
-- 5. marks public.token_purchases as paid.
--
-- Legacy trigger `trigger_auto_credit_tokens` on public.token_purchases also credited tokens
-- through `auto_credit_tokens_on_payment()`, causing duplicate wallet credits.
--
-- Example incident:
-- - purchase amount: 5 tokens
-- - expected wallet increment: +5
-- - observed wallet increment: +10

DROP TRIGGER IF EXISTS trigger_auto_credit_tokens ON public.token_purchases;

-- Keep the legacy function name, but neutralize it defensively in case another trigger or manual call exists.
-- This avoids breaking deployments that reference the function while preventing future duplicate credits.
CREATE OR REPLACE FUNCTION public.auto_credit_tokens_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'auto_credit_tokens_on_payment is deprecated and intentionally disabled. Use process_token_purchase_atomic instead.';
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_credit_tokens_on_payment() IS
'Deprecated no-op. Token purchase credits must be processed exclusively by process_token_purchase_atomic.';
