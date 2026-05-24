-- Create admin users overview from auth.users as source of truth.
--
-- Context:
-- Admin dashboard was counting users from public.profiles only.
-- If an authenticated user exists without a matching profile row, the admin area undercounts users.
-- This view exposes a complete administrative overview using auth.users as the base table.

CREATE OR REPLACE VIEW public.admin_users_overview AS
SELECT
  au.id,
  au.email,
  au.created_at AS registered_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  au.phone,
  au.raw_user_meta_data,
  p.nome,
  p.sobrenome,
  p.celular,
  p.avatar_url,
  p.created_at AS profile_created_at,
  p.updated_at AS profile_updated_at,
  COALESCE(ur.role::text, 'user') AS role,
  ur.admin_type,
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
) project_stats ON true;

ALTER VIEW public.admin_users_overview SET (security_invoker = true);

GRANT SELECT ON public.admin_users_overview TO authenticated;

COMMENT ON VIEW public.admin_users_overview IS
'Admin-only intended user overview based on auth.users, enriched with profiles, roles, tokens and project stats.';
