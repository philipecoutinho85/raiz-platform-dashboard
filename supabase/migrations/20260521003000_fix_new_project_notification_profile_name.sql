-- Fix new project notification trigger to use the real profile name columns.
-- Production was failing project creation with: column p.full_name does not exist.
-- public.profiles stores the creator name in nome/sobrenome, not full_name.

CREATE OR REPLACE FUNCTION public.notify_admins_new_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user record;
  v_creator_name text;
BEGIN
  SELECT NULLIF(trim(concat_ws(' ', p.nome, p.sobrenome)), '')
  INTO v_creator_name
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  FOR v_admin_user IN
    SELECT DISTINCT user_id
    FROM public.user_roles
    WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_admin_user.user_id,
      'new_project',
      'Novo Projeto para Revisao',
      'Um novo projeto "' || NEW.title || '" de ' || COALESCE(v_creator_name, 'criador nao identificado') || ' foi enviado para analise.',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_admins_new_project ON public.projects;
CREATE TRIGGER trigger_notify_admins_new_project
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_project();
