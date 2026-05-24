-- Fix completed refunds without user notification.
-- Read/write maintenance script.
-- Purpose: create missing user notifications for completed refunds that were already processed.
--
-- Robustness:
-- - Uses refunds.project_id when present.
-- - Falls back to project_contributions.project_id when refunds.project_id is null.
-- - Uses IS NOT DISTINCT FROM for null-safe matching.

BEGIN;

WITH refund_scope AS (
  SELECT
    r.id AS refund_id,
    r.user_id,
    r.project_id,
    r.contribution_id,
    COALESCE(r.project_id, pc.project_id) AS effective_project_id,
    r.amount,
    r.processed_at,
    COALESCE(p.title, p_from_contribution.title) AS project_title
  FROM public.refunds r
  LEFT JOIN public.project_contributions pc ON pc.id = r.contribution_id
  LEFT JOIN public.projects p ON p.id = r.project_id
  LEFT JOIN public.projects p_from_contribution ON p_from_contribution.id = pc.project_id
  WHERE r.status = 'completed'
), missing_refund_notifications AS (
  SELECT rs.*
  FROM refund_scope rs
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = rs.user_id
      AND n.related_id IS NOT DISTINCT FROM rs.effective_project_id
      AND n.type IN ('project_refund', 'refund', 'project_deleted_refund')
  )
), inserted AS (
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    created_at
  )
  SELECT
    mrn.user_id,
    'project_refund',
    'Tokens devolvidos',
    'Os tokens do seu apoio foram devolvidos' ||
      CASE
        WHEN mrn.project_title IS NOT NULL THEN ' no projeto "' || mrn.project_title || '".'
        ELSE '.'
      END,
    mrn.effective_project_id,
    COALESCE(mrn.processed_at, now())
  FROM missing_refund_notifications mrn
  RETURNING id, user_id, related_id, created_at
)
SELECT
  i.id AS notification_id,
  au.email AS user_email,
  i.related_id AS project_id,
  i.created_at
FROM inserted i
LEFT JOIN auth.users au ON au.id = i.user_id;

COMMIT;

-- Verification: should return zero rows after fix.
WITH refund_scope AS (
  SELECT
    r.id AS refund_id,
    r.user_id,
    r.project_id,
    r.contribution_id,
    COALESCE(r.project_id, pc.project_id) AS effective_project_id,
    r.amount,
    r.status,
    r.processed_at,
    COALESCE(p.title, p_from_contribution.title) AS project_title
  FROM public.refunds r
  LEFT JOIN public.project_contributions pc ON pc.id = r.contribution_id
  LEFT JOIN public.projects p ON p.id = r.project_id
  LEFT JOIN public.projects p_from_contribution ON p_from_contribution.id = pc.project_id
  WHERE r.status = 'completed'
)
SELECT
  'refund_without_notification' AS issue_type,
  rs.refund_id,
  au.email AS user_email,
  rs.project_id,
  rs.contribution_id,
  rs.effective_project_id,
  rs.project_title,
  rs.amount,
  rs.status,
  rs.processed_at
FROM refund_scope rs
LEFT JOIN auth.users au ON au.id = rs.user_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.notifications n
  WHERE n.user_id = rs.user_id
    AND n.related_id IS NOT DISTINCT FROM rs.effective_project_id
    AND n.type IN ('project_refund', 'refund', 'project_deleted_refund')
)
ORDER BY rs.processed_at DESC NULLS LAST;
