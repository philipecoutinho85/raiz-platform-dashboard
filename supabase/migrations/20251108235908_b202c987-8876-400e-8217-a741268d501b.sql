-- Criar notificações quando admin envia feedback ao projeto
CREATE OR REPLACE FUNCTION notify_project_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o projeto foi rejeitado ou tem pending_requirements
  IF (NEW.status = 'rejected' AND OLD.status != 'rejected') OR
     (NEW.pending_requirements IS NOT NULL AND NEW.pending_requirements != OLD.pending_requirements) THEN
    
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'project_feedback',
      CASE 
        WHEN NEW.status = 'rejected' THEN 'Projeto Rejeitado'
        ELSE 'Ajustes Necessários no Projeto'
      END,
      CASE 
        WHEN NEW.status = 'rejected' THEN 'Seu projeto "' || NEW.title || '" foi rejeitado. Motivo: ' || COALESCE(NEW.rejection_reason, 'Não especificado')
        ELSE 'Seu projeto "' || NEW.title || '" precisa de ajustes: ' || NEW.pending_requirements
      END,
      NEW.id
    );
  END IF;
  
  -- Se aprovado
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'project_approved',
      'Projeto Aprovado! 🎉',
      'Seu projeto "' || NEW.title || '" foi aprovado e já está disponível na plataforma!',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para notificar feedback do admin
DROP TRIGGER IF EXISTS trigger_notify_project_feedback ON public.projects;
CREATE TRIGGER trigger_notify_project_feedback
AFTER UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION notify_project_feedback();

-- Atualizar função de notificação de comentários para notificar o criador do projeto
CREATE OR REPLACE FUNCTION notify_project_owner_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  project_owner_id uuid;
  project_title text;
  commenter_name text;
BEGIN
  -- Pegar o owner do projeto e o título
  SELECT user_id, title INTO project_owner_id, project_title
  FROM public.projects
  WHERE id = NEW.project_id;
  
  -- Pegar nome do comentarista
  SELECT nome || ' ' || sobrenome INTO commenter_name
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Se não é o owner comentando e é uma pergunta, notificar o owner
  IF project_owner_id != NEW.user_id AND NEW.comment_type = 'question' AND NEW.parent_comment_id IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      project_owner_id,
      'new_comment',
      'Nova Dúvida no Projeto',
      commenter_name || ' deixou uma dúvida no projeto "' || project_title || '"',
      NEW.project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para notificar owner de novos comentários
DROP TRIGGER IF EXISTS trigger_notify_project_owner_comment ON public.project_comments;
CREATE TRIGGER trigger_notify_project_owner_comment
AFTER INSERT ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION notify_project_owner_comment();

-- Criar notificação quando comentário é denunciado
CREATE OR REPLACE FUNCTION notify_admin_reported_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_user RECORD;
  project_title text;
BEGIN
  -- Se comentário foi denunciado
  IF NEW.is_reported = true AND (OLD.is_reported = false OR OLD.is_reported IS NULL) THEN
    
    -- Pegar título do projeto
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- Notificar todos os admins
    FOR admin_user IN 
      SELECT DISTINCT user_id 
      FROM public.user_roles 
      WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        admin_user.user_id,
        'comment_reported',
        'Comentário Denunciado',
        'Um comentário foi denunciado no projeto "' || project_title || '". Revise e tome as ações necessárias.',
        NEW.project_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para notificar admins sobre comentários denunciados
DROP TRIGGER IF EXISTS trigger_notify_admin_reported_comment ON public.project_comments;
CREATE TRIGGER trigger_notify_admin_reported_comment
AFTER UPDATE ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION notify_admin_reported_comment();