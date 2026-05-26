-- Fixes project lifecycle operations that should not depend on client-side RLS visibility.
-- 1) Admin project overview now includes draft projects for admin counting/listing.
-- 2) Creators can delete their own draft projects if there is no financial history.
-- 3) Admin approval moves pending projects to approved through a SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION public.admin_get_projects_overview()
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  author_email text,
  category text,
  goal numeric,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  user_id uuid,
  raised_amount numeric,
  backers_count integer,
  deadline timestamptz,
  endereco text,
  cidade text,
  estado text,
  youtube_url text,
  featured_image text,
  custom_goal numeric,
  admin_fee_percentage numeric,
  rejection_reason text,
  pending_requirements text,
  project_type text,
  platform_fee_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title::text,
    COALESCE(NULLIF(TRIM(CONCAT(COALESCE(pr.nome, ''), ' ', COALESCE(pr.sobrenome, ''))), ''), pr.email, 'Usuário sem perfil')::text AS author,
    COALESCE(pr.email, 'E-mail não encontrado no perfil')::text AS author_email,
    p.category::text,
    p.goal::numeric,
    p.description::text,
    p.created_at,
    p.updated_at,
    p.status::text,
    p.user_id,
    COALESCE(p.raised_amount, 0)::numeric,
    COALESCE(p.backers_count, 0)::integer,
    p.deadline,
    p.endereco::text,
    p.cidade::text,
    p.estado::text,
    p.youtube_url::text,
    pi.image_url::text AS featured_image,
    p.custom_goal::numeric,
    p.admin_fee_percentage::numeric,
    p.rejection_reason::text,
    p.pending_requirements::text,
    p.project_type::text,
    p.platform_fee_percentage::numeric
  FROM public.projects p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  LEFT JOIN LATERAL (
    SELECT image_url
    FROM public.project_images
    WHERE project_id = p.id
      AND is_featured = true
    ORDER BY created_at ASC
    LIMIT 1
  ) pi ON true
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_projects_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_projects_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_project_for_publication(
  p_project_id uuid,
  p_project_type text
)
RETURNS TABLE(
  id uuid,
  status text,
  project_type text,
  platform_fee_percentage numeric,
  reviewed_at timestamptz,
  reviewed_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_platform_fee numeric;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  IF p_project_type NOT IN ('seed', 'regular') THEN
    RAISE EXCEPTION 'INVALID_PROJECT_TYPE';
  END IF;

  v_platform_fee := CASE WHEN p_project_type = 'seed' THEN 0 ELSE 10 END;

  RETURN QUERY
  UPDATE public.projects p
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_admin_id,
      project_type = p_project_type,
      platform_fee_percentage = v_platform_fee,
      updated_at = now()
  WHERE p.id = p_project_id
    AND p.status = 'pending'
  RETURNING
    p.id,
    p.status::text,
    p.project_type::text,
    p.platform_fee_percentage::numeric,
    p.reviewed_at,
    p.reviewed_by;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROJECT_NOT_PENDING_OR_NOT_FOUND';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_project_for_publication(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_project_for_publication(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_own_draft_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projects%ROWTYPE;
  v_has_financial_history boolean := false;
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
    RAISE EXCEPTION 'ONLY_DRAFT_CAN_BE_DELETED';
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
    RAISE EXCEPTION 'DRAFT_HAS_FINANCIAL_HISTORY';
  END IF;

  DELETE FROM public.project_images
  WHERE project_id = p_project_id;

  DELETE FROM public.projects
  WHERE id = p_project_id
    AND user_id = auth.uid()
    AND status = 'draft';
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_draft_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_draft_project(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_get_projects_overview() IS 'Admin-only project overview including draft, pending, approved, rejected and archived projects.';
COMMENT ON FUNCTION public.admin_approve_project_for_publication(uuid, text) IS 'Admin-only approval RPC that safely moves a pending project to approved.';
COMMENT ON FUNCTION public.delete_own_draft_project(uuid) IS 'Allows the authenticated creator to delete their own draft project before review/publication if no financial history exists.';
