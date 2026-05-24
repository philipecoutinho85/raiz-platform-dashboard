-- Prepare projects for lower-friction creation flow.
--
-- Scope:
-- - Allow project drafts.
-- - Keep existing lifecycle statuses.
-- - Make project YouTube video optional at database level.
--
-- Does NOT change checkout, wallet, ledger, Stripe, refunds, support or auth.

-- 1. Make video optional at DB level.
ALTER TABLE public.projects
ALTER COLUMN youtube_url DROP NOT NULL;

-- 2. Expand project status lifecycle safely.
-- Existing production statuses observed/used: pending, approved, rejected, completed, cancelled.
-- New status for creation flow: draft.
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_status_check
CHECK (
  status IN (
    'draft',
    'pending',
    'pending_review',
    'approved',
    'published',
    'rejected',
    'completed',
    'cancelled',
    'canceled',
    'archived',
    'deleted'
  )
);

COMMENT ON CONSTRAINT projects_status_check ON public.projects IS
'Project lifecycle statuses. draft is used for creator-side work-in-progress before KYC/publication review.';
