-- Support, notifications and admin logs audit script.
-- Read-only.
-- Purpose: validate traceability for critical administrative and financial actions.

-- 1. Recent admin logs.
SELECT
  al.id,
  admin.email AS admin_email,
  al.action,
  al.target_type,
  al.target_id,
  al.details,
  al.created_at
FROM public.admin_logs al
LEFT JOIN auth.users admin ON admin.id = al.admin_id
ORDER BY al.created_at DESC
LIMIT 50;

-- 2. Critical project lifecycle events.
SELECT
  ple.id,
  p.title AS project_title,
  p.status AS current_project_status,
  ple.event_type,
  ple.previous_status,
  ple.new_status,
  actor.email AS performed_by_email,
  ple.tokens_refunded,
  ple.contributions_refunded,
  ple.metadata,
  ple.created_at
FROM public.project_lifecycle_events ple
LEFT JOIN public.projects p ON p.id = ple.project_id
LEFT JOIN auth.users actor ON actor.id = ple.performed_by
ORDER BY ple.created_at DESC
LIMIT 50;

-- 3. Cancelled projects without lifecycle event.
SELECT
  'cancelled_project_without_lifecycle_event' AS issue_type,
  p.id AS project_id,
  p.title,
  p.status,
  p.updated_at
FROM public.projects p
WHERE p.status = 'cancelled'
  AND NOT EXISTS (
    SELECT 1
    FROM public.project_lifecycle_events ple
    WHERE ple.project_id = p.id
      AND ple.new_status = 'cancelled'
  )
ORDER BY p.updated_at DESC NULLS LAST;

-- 4. Cancelled projects without admin log.
SELECT
  'cancelled_project_without_admin_log' AS issue_type,
  p.id AS project_id,
  p.title,
  p.status,
  p.updated_at
FROM public.projects p
WHERE p.status = 'cancelled'
  AND NOT EXISTS (
    SELECT 1
    FROM public.admin_logs al
    WHERE al.target_type = 'project'
      AND al.target_id = p.id
      AND al.action ILIKE '%cancel%'
  )
ORDER BY p.updated_at DESC NULLS LAST;

-- 5. Refunds without notification to the user.
SELECT
  'refund_without_notification' AS issue_type,
  r.id AS refund_id,
  r.project_id,
  p.title AS project_title,
  r.contribution_id,
  r.user_id,
  au.email AS user_email,
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

-- 6. Notifications referencing missing users.
SELECT
  'notification_missing_user' AS issue_type,
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.related_id,
  n.created_at
FROM public.notifications n
LEFT JOIN auth.users au ON au.id = n.user_id
WHERE au.id IS NULL
ORDER BY n.created_at DESC;

-- 7. Support conversations without messages.
SELECT
  'support_conversation_without_messages' AS issue_type,
  sc.id,
  sc.ticket_number,
  sc.user_id,
  au.email AS user_email,
  sc.subject,
  sc.status,
  sc.created_at
FROM public.support_conversations sc
LEFT JOIN auth.users au ON au.id = sc.user_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.support_messages sm
  WHERE sm.conversation_id = sc.id
)
ORDER BY sc.created_at DESC;

-- 8. Support conversations open without first response.
SELECT
  'open_support_without_first_response' AS issue_type,
  sc.id,
  sc.ticket_number,
  sc.user_id,
  au.email AS user_email,
  sc.subject,
  sc.status,
  sc.first_response_at,
  sc.created_at
FROM public.support_conversations sc
LEFT JOIN auth.users au ON au.id = sc.user_id
WHERE sc.status IN ('open', 'pending', 'in_progress')
  AND sc.first_response_at IS NULL
ORDER BY sc.created_at ASC;

-- 9. Support resolved without rating.
SELECT
  'resolved_support_without_rating' AS issue_type,
  sc.id,
  sc.ticket_number,
  sc.user_id,
  au.email AS user_email,
  sc.subject,
  sc.status,
  sc.resolved_at,
  sc.rating,
  sc.rated_at
FROM public.support_conversations sc
LEFT JOIN auth.users au ON au.id = sc.user_id
WHERE sc.status IN ('resolved', 'closed')
  AND sc.rating IS NULL
ORDER BY sc.resolved_at DESC NULLS LAST;

-- 10. Summary counts.
SELECT
  (SELECT COUNT(*) FROM public.admin_logs) AS admin_logs_count,
  (SELECT COUNT(*) FROM public.project_lifecycle_events) AS project_lifecycle_events_count,
  (SELECT COUNT(*) FROM public.notifications) AS notifications_count,
  (SELECT COUNT(*) FROM public.support_conversations) AS support_conversations_count,
  (SELECT COUNT(*) FROM public.support_messages) AS support_messages_count;
