-- Secure admin users overview RPC.
-- Source of truth: auth.users.
-- Purpose: prevent admin dashboard from undercounting users when public.profiles is missing/incomplete.

CREATE OR REPLACE FUNCTION public.admin_get_users_overview()
RETURNS TABLE(
  id uuid,
  email text,
  registered_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  nome text,
  sobrenome text,
  celular text,
  avatar_url text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  role text,
  admin_type text,
  token_balance integer,
  projects_count integer,
  active_projects_count integer,
  total_raised numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    p.nome::text,
    p.sobrenome::text,
    p.celular::text,
    p.avatar_url::text,
    p.created_at,
    p.updated_at,
    COALESCE(ur.role::text, 'user') AS role,
    ur.admin_type::text,
    COALESCE(ut.balance, 0)::integer AS token_balance,
    COALESCE(project_stats.projects_count, 0)::integer AS projects_count,
    COALESCE(project_stats.active_projects_count, 0)::integer AS active_projects_count,
    COALESCE(project_stats.total_raised, 0)::numeric AS total_raised
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  LEFT JOIN public.user_tokens ut ON ut.user_id = au.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS projects_count,
      COUNT(*) FILTER (WHERE pr.status = 'approved') AS active_projects_count,
      COALESCE(SUM(pr.raised_amount), 0)::numeric AS total_raised
    FROM public.projects pr
    WHERE pr.user_id = au.id
  ) project_stats ON true
  ORDER BY au.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_users_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_users_overview() TO authenticated;

COMMENT ON FUNCTION public.admin_get_users_overview() IS
'Admin-only RPC returning all auth.users enriched with profile, role, token and project information.';
