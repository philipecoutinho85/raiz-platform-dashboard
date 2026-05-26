-- Allows a creator to submit their own draft project for admin review after KYC.
-- Keeps publication controlled by the admin approval flow.

CREATE OR REPLACE FUNCTION public.submit_project_draft_for_review(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projects%ROWTYPE;
  v_is_verified boolean := false;
  v_has_featured_image boolean := false;
  v_has_blocking_project boolean := false;
  v_has_pending_accountability boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT *
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND';
  END IF;

  IF v_project.status <> 'draft' THEN
    RAISE EXCEPTION 'PROJECT_NOT_DRAFT';
  END IF;

  SELECT COALESCE(stripe_onboarding_complete, false) OR COALESCE(is_identity_verified, false)
  INTO v_is_verified
  FROM public.profiles
  WHERE id = auth.uid();

  IF COALESCE(v_is_verified, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'KYC_REQUIRED';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.project_images
    WHERE project_id = p_project_id
      AND is_featured = true
  )
  INTO v_has_featured_image;

  IF COALESCE(v_has_featured_image, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'FEATURED_IMAGE_REQUIRED';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.user_id = auth.uid()
      AND p.id <> p_project_id
      AND (
        p.status = 'pending'
        OR (
          p.status = 'approved'
          AND COALESCE(p.raised_amount, 0) < COALESCE(p.custom_goal, p.goal)
          AND (p.deadline IS NULL OR p.deadline >= now())
        )
      )
  )
  INTO v_has_blocking_project;

  IF COALESCE(v_has_blocking_project, false) IS TRUE THEN
    RAISE EXCEPTION 'ACTIVE_PROJECT_EXISTS';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.user_id = auth.uid()
      AND p.status = 'approved'
      AND COALESCE(p.raised_amount, 0) >= COALESCE(p.custom_goal, p.goal)
      AND COALESCE(p.accountability_approved, false) = false
  )
  INTO v_has_pending_accountability;

  IF COALESCE(v_has_pending_accountability, false) IS TRUE THEN
    RAISE EXCEPTION 'ACCOUNTABILITY_PENDING';
  END IF;

  UPDATE public.projects
  SET status = 'pending',
      updated_at = now()
  WHERE id = p_project_id
    AND user_id = auth.uid()
    AND status = 'draft';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_project_draft_for_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_project_draft_for_review(uuid) TO authenticated;
