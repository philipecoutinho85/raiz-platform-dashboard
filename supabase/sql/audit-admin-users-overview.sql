-- Admin users overview audit script.
-- Read-only.
-- Purpose: validate that the admin panel sees all registered users from auth.users,
-- including registration date/time, profile coverage and admin roles.

-- 1. Complete users overview from auth.users.
SELECT
  au.id,
  au.email,
  au.created_at AS registered_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  CASE WHEN p.id IS NULL THEN false ELSE true END AS has_profile,
  p.nome,
  p.sobrenome,
  p.celular,
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
) project_stats ON true
ORDER BY au.created_at DESC;

-- 2. Count comparison.
SELECT
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) AS profiles_count,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') AS admins_count,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin' AND admin_type = 'master') AS admin_master_count;

-- 3. Users missing profile.
SELECT
  au.id,
  au.email,
  au.created_at AS registered_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Profiles without auth user.
SELECT
  p.id,
  p.email,
  p.nome,
  p.sobrenome,
  p.created_at AS profile_created_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE au.id IS NULL
ORDER BY p.created_at DESC;

-- 5. Admin master verification.
SELECT
  au.id,
  au.email,
  ur.role,
  ur.admin_type,
  ur.created_at AS role_created_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY ur.admin_type DESC NULLS LAST, au.email;
