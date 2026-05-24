-- Support, notifications and admin logs blocker summary.
-- Read-only.
-- Returns counts by issue type. Zero count means no blocker for that category.

WITH cancelled_project_without_lifecycle_event AS (
  SELECT p.id
  FROM public.projects p
  WHERE p.status = 'cancelled'
    AND NOT EXISTS (
      SELECT 1
      FROM public.project_lifecycle_events ple
      WHERE ple.project_id = p.id
        AND ple.new_status = 'cancelled'
    )
), cancelled_project_without_admin_log AS (
  SELECT p.id
  FROM public.projects p
  WHERE p.status = 'cancelled'
    AND NOT EXISTS (
      SELECT 1
      FROM public.admin_logs al
      WHERE al.target_type = 'project'
        AND al.target_id = p.id
        AND al.action ILIKE '%cancel%'
    )
), refund_without_notification AS (
  SELECT r.id
  FROM public.refunds r
  WHERE r.status = 'completed'
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = r.user_id
        AND n.related_id = r.project_id
        AND n.type IN ('project_refund', 'refund', 'project_deleted_refund')
    )
), notification_missing_user AS (
  SELECT n.id
  FROM public.notifications n
  LEFT JOIN auth.users au ON au.id = n.user_id
  WHERE au.id IS NULL
), support_conversation_without_messages AS (
  SELECT sc.id
  FROM public.support_conversations sc
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.support_messages sm
    WHERE sm.conversation_id = sc.id
  )
), open_support_without_first_response AS (
  SELECT sc.id
  FROM public.support_conversations sc
  WHERE sc.status IN ('open', 'pending', 'in_progress')
    AND sc.first_response_at IS NULL
), resolved_support_without_rating AS (
  SELECT sc.id
  FROM public.support_conversations sc
  WHERE sc.status IN ('resolved', 'closed')
    AND sc.rating IS NULL
)
SELECT 'cancelled_project_without_lifecycle_event' AS issue_type, COUNT(*) AS issue_count FROM cancelled_project_without_lifecycle_event
UNION ALL
SELECT 'cancelled_project_without_admin_log', COUNT(*) FROM cancelled_project_without_admin_log
UNION ALL
SELECT 'refund_without_notification', COUNT(*) FROM refund_without_notification
UNION ALL
SELECT 'notification_missing_user', COUNT(*) FROM notification_missing_user
UNION ALL
SELECT 'support_conversation_without_messages', COUNT(*) FROM support_conversation_without_messages
UNION ALL
SELECT 'open_support_without_first_response', COUNT(*) FROM open_support_without_first_response
UNION ALL
SELECT 'resolved_support_without_rating', COUNT(*) FROM resolved_support_without_rating
ORDER BY issue_count DESC, issue_type;
