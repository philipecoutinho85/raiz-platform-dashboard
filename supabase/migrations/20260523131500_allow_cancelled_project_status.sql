-- Allow cancelled/archived project statuses.
--
-- Context:
-- The audited project lifecycle uses `cancelled` to preserve projects with financial history
-- instead of physically deleting them. The existing projects_status_check constraint did not
-- allow `cancelled`, causing cancellation attempts to fail.

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_status_check
CHECK (status IN (
  'draft',
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'deleted',
  'archived'
));
