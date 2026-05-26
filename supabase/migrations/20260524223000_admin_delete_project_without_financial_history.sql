-- Safe admin deletion for projects that never had financial movement.
-- Approved projects are intentionally excluded: once approved/published they must be cancelled,
-- not physically deleted, to preserve governance and auditability.

CREATE OR REPLACE FUNCTION public.admin_delete_project_without_financial_history(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_project public.projects%ROWTYPE;
  v_has_financial_history boolean := false;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  SELECT *
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND';
  END IF;

  IF v_project.status IN ('approved', 'cancelled', 'deleted', 'archived') THEN
    RAISE EXCEPTION 'PROJECT_MUST_BE_CANCELLED_NOT_DELETED';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.contributions c
    WHERE c.project_id = p_project_id
  )
  INTO v_has_financial_history;

  IF COALESCE(v_project.raised_amount, 0) > 0
     OR COALESCE(v_project.backers_count, 0) > 0
     OR COALESCE(v_has_financial_history, false) IS TRUE THEN
    RAISE EXCEPTION 'PROJECT_HAS_FINANCIAL_HISTORY';
  END IF;

  DELETE FROM public.project_images
  WHERE project_id = p_project_id;

  DELETE FROM public.projects
  WHERE id = p_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_project_without_financial_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_project_without_financial_history(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_project_without_financial_history(uuid) IS
'Admin-only safe deletion for draft/pending/rejected projects without financial history. Approved projects must be cancelled, not deleted.';
