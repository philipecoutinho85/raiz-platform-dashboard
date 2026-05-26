-- Restore admin visibility for every project lifecycle status in the Projects tab.
-- The admin overview must not depend on public marketplace visibility or client-side RLS filters.

DROP FUNCTION IF EXISTS public.admin_get_projects_overview();

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
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = v_admin_id
      AND ur.role = 'admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title::text,
    COALESCE(NULLIF(TRIM(CONCAT(COALESCE(pr.nome, ''), ' ', COALESCE(pr.sobrenome, ''))), ''), pr.email, 'Usuario sem perfil')::text AS author,
    COALESCE(pr.email, 'E-mail nao encontrado no perfil')::text AS author_email,
    p.category::text,
    COALESCE(p.goal, 0)::numeric,
    COALESCE(p.description, '')::text,
    p.created_at,
    p.updated_at,
    COALESCE(p.status, 'draft')::text,
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
$function$;

REVOKE ALL ON FUNCTION public.admin_get_projects_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_projects_overview() TO authenticated;

COMMENT ON FUNCTION public.admin_get_projects_overview() IS
'Admin-only project overview returning every lifecycle status, including draft projects awaiting KYC.';
