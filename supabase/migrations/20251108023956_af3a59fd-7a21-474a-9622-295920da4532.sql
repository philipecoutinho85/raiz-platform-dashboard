-- Adicionar campos para rastrear edições de descrição
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS description_edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS description_edit_count integer DEFAULT 0;

-- Criar função para notificar admins sobre novos projetos
CREATE OR REPLACE FUNCTION public.notify_admins_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notificar todos os admins quando um novo projeto for criado
  FOR admin_user IN 
    SELECT DISTINCT user_id 
    FROM public.user_roles 
    WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      admin_user.user_id,
      'new_project',
      'Novo Projeto para Revisão',
      'Um novo projeto "' || NEW.title || '" foi enviado para análise.',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para notificar admins
DROP TRIGGER IF EXISTS trigger_notify_admins_new_project ON public.projects;
CREATE TRIGGER trigger_notify_admins_new_project
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_project();