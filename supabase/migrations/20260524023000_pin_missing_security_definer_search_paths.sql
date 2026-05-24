-- Pin missing search_path on SECURITY DEFINER functions.
--
-- Context:
-- SECURITY DEFINER functions should have an explicit search_path to reduce risk of object-shadowing
-- and unsafe name resolution.
--
-- This migration does not change function logic, grants or behavior.
-- It only pins search_path for functions identified by the RLS/security posture audit.

ALTER FUNCTION public.assign_badges_by_category()
SET search_path = public;

ALTER FUNCTION public.call_mailgun_sync(uuid, text, text, text)
SET search_path = public;

ALTER FUNCTION public.has_role(uuid, app_role)
SET search_path = public;

ALTER FUNCTION public.trigger_process_withdrawal()
SET search_path = public;

ALTER FUNCTION public.trigger_sync_new_profile()
SET search_path = public;

ALTER FUNCTION public.trigger_sync_project_author()
SET search_path = public;
