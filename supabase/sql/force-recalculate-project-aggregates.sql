-- Force recalculation of project aggregate fields from completed contributions.
-- Read/write maintenance script.
-- Use when projects.raised_amount/backers_count diverge from project_contributions.

BEGIN;

WITH aggregate_data AS (
  SELECT
    p.id AS project_id,
    COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::numeric AS calculated_raised_amount,
    COUNT(DISTINCT pc.user_id) FILTER (WHERE pc.status = 'completed')::integer AS calculated_backers_count
  FROM public.projects p
  LEFT JOIN public.project_contributions pc ON pc.project_id = p.id
  GROUP BY p.id
), updated AS (
  UPDATE public.projects p
  SET raised_amount = a.calculated_raised_amount,
      backers_count = a.calculated_backers_count,
      updated_at = now()
  FROM aggregate_data a
  WHERE p.id = a.project_id
    AND (
      p.raised_amount IS DISTINCT FROM a.calculated_raised_amount
      OR p.backers_count IS DISTINCT FROM a.calculated_backers_count
    )
  RETURNING
    p.id,
    p.title,
    p.status,
    p.raised_amount,
    p.backers_count
)
SELECT * FROM updated
ORDER BY title;

COMMIT;

-- Verification after forced recalculation.
SELECT
  p.id,
  p.title,
  p.status,
  p.raised_amount,
  p.backers_count,
  COUNT(pc.id) FILTER (WHERE pc.status = 'completed') AS completed_contributions_count,
  COALESCE(SUM(pc.amount) FILTER (WHERE pc.status = 'completed'), 0)::integer AS completed_contributions_tokens,
  COUNT(r.id) AS refunds_count,
  COALESCE(SUM(r.amount), 0)::integer AS refunded_tokens
FROM public.projects p
LEFT JOIN public.project_contributions pc ON pc.project_id = p.id
LEFT JOIN public.refunds r ON r.project_id = p.id
WHERE p.id = '1db24cf5-b25a-4948-be40-6fc68045952d'
GROUP BY p.id, p.title, p.status, p.raised_amount, p.backers_count;
