-- Fix completed refunds without user notification.
-- Read/write maintenance script.
-- Purpose: create missing user notifications for completed refunds that were already processed.

BEGIN;

WITH missing_refund_notifications AS (
  SELECT
    r.id AS refund_id,
    r.user_id,
    r.project_id,
    r.contribution_id,
    r.amount,
    r.processed_at,
    p.title AS project_title
  FROM public.refunds r
  LEFT JOIN public.projects p ON p.id = r.project_id
  WHERE r.status = 'completed'
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = r.user_id
        AND n.related_id = r.project_id
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
    mrn.project_id,
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
SELECT
  'refund_without_notification' AS issue_type,
  r.id AS refund_id,
  au.email AS user_email,
  r.project_id,
  p.title AS project_title,
  r.amount,
  r.status,
  r.processed_at
FROM public.refunds r
LEFT JOIN public.projects p ON p.id = r.project_id
LEFT JOIN auth.users au ON au.id = r.user_id
WHERE r.status = 'completed'
  AND NOT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = r.user_id
      AND n.related_id = r.project_id
      AND n.type IN ('project_refund', 'refund', 'project_deleted_refund')
  )
ORDER BY r.processed_at DESC NULLS LAST;
