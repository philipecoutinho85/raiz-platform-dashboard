-- Atualizar tabela de comentários para suportar respostas e moderação
ALTER TABLE public.project_comments
ADD COLUMN parent_comment_id uuid REFERENCES public.project_comments(id) ON DELETE CASCADE,
ADD COLUMN is_hidden boolean DEFAULT false,
ADD COLUMN hidden_by uuid REFERENCES auth.users(id),
ADD COLUMN hidden_at timestamp with time zone,
ADD COLUMN is_reported boolean DEFAULT false,
ADD COLUMN reported_by uuid REFERENCES auth.users(id),
ADD COLUMN reported_at timestamp with time zone;

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS para notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Atualizar RLS de comentários para permitir que criador do projeto responda
CREATE POLICY "Project owners can reply to comments"
ON public.project_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_comments.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Política para moderadores ocultarem comentários
CREATE POLICY "Moderators can hide comments"
ON public.project_comments FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'moderator')
);

-- Função para criar notificação quando projeto é concluído
CREATE OR REPLACE FUNCTION public.notify_project_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificar todos os apoiadores quando o projeto for concluído
  IF NEW.status = 'approved' AND NEW.raised_amount >= NEW.goal THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    SELECT DISTINCT 
      pc.user_id,
      'project_completed',
      'Projeto Concluído!',
      'O projeto "' || NEW.title || '" que você apoiou foi concluído com sucesso!',
      NEW.id
    FROM public.project_contributions pc
    WHERE pc.project_id = NEW.id
    AND pc.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificação de conclusão de projeto
CREATE TRIGGER notify_on_project_completion
AFTER UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.notify_project_completion();

-- Função para criar notificação quando há resposta em comentário
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_user_id uuid;
  project_title text;
BEGIN
  -- Se é uma resposta (tem parent_comment_id)
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Pegar o user_id do comentário pai
    SELECT user_id INTO parent_user_id
    FROM public.project_comments
    WHERE id = NEW.parent_comment_id;
    
    -- Pegar título do projeto
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- Criar notificação para o autor do comentário original
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        parent_user_id,
        'comment_reply',
        'Nova Resposta',
        'Você recebeu uma resposta no projeto "' || project_title || '"',
        NEW.project_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificação de resposta
CREATE TRIGGER notify_on_comment_reply
AFTER INSERT ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_reply();