-- 1. Criar tabela de mensagens de resgate para chat simplificado
CREATE TABLE IF NOT EXISTS public.withdrawal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar campo para controlar se o chat está ativo
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS chat_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS chat_closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS chat_closed_by UUID;

-- 2. Criar tabela de denúncias de projetos
CREATE TABLE IF NOT EXISTS public.project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies para withdrawal_messages
CREATE POLICY "Users can view messages from their withdrawals"
  ON public.withdrawal_messages
  FOR SELECT
  USING (
    withdrawal_id IN (
      SELECT id FROM public.withdrawals WHERE user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create messages on their withdrawals"
  ON public.withdrawal_messages
  FOR INSERT
  WITH CHECK (
    withdrawal_id IN (
      SELECT id FROM public.withdrawals WHERE user_id = auth.uid()
    ) AND user_id = auth.uid() AND is_admin = false
  );

CREATE POLICY "Admins can create messages on any withdrawal"
  ON public.withdrawal_messages
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_admin = true);

CREATE POLICY "Admins can view all messages"
  ON public.withdrawal_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para project_reports
CREATE POLICY "Users can create reports"
  ON public.project_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports"
  ON public.project_reports
  FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all reports"
  ON public.project_reports
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_messages_withdrawal_id ON public.withdrawal_messages(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_messages_created_at ON public.withdrawal_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_project_reports_project_id ON public.project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_status ON public.project_reports(status);

-- Trigger para notificar admins sobre novas denúncias
CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  project_title TEXT;
BEGIN
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
      'project_report',
      'Nova Denúncia de Projeto',
      'O projeto "' || project_title || '" foi denunciado e precisa de análise.',
      NEW.project_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_report_created
  AFTER INSERT ON public.project_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_report();

-- Função para validar CPF
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  numbers TEXT;
  sum INTEGER;
  digit1 INTEGER;
  digit2 INTEGER;
BEGIN
  -- Remove caracteres não numéricos
  numbers := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Verifica se tem 11 dígitos
  IF length(numbers) != 11 THEN
    RETURN false;
  END IF;
  
  -- Verifica se todos os dígitos são iguais (CPF inválido)
  IF numbers ~ '^(.)\1{10}$' THEN
    RETURN false;
  END IF;
  
  -- Calcula primeiro dígito verificador
  sum := 0;
  FOR i IN 1..9 LOOP
    sum := sum + (substring(numbers, i, 1)::INTEGER * (11 - i));
  END LOOP;
  digit1 := 11 - (sum % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Verifica primeiro dígito
  IF digit1 != substring(numbers, 10, 1)::INTEGER THEN
    RETURN false;
  END IF;
  
  -- Calcula segundo dígito verificador
  sum := 0;
  FOR i IN 1..10 LOOP
    sum := sum + (substring(numbers, i, 1)::INTEGER * (12 - i));
  END LOOP;
  digit2 := 11 - (sum % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verifica segundo dígito
  IF digit2 != substring(numbers, 11, 1)::INTEGER THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Trigger para notificar usuário quando admin responder denúncia
CREATE OR REPLACE FUNCTION public.notify_user_report_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status != OLD.status AND NEW.admin_response IS NOT NULL THEN
    -- Pegar título do projeto
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- Notificar o usuário que fez a denúncia
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.reported_by,
      'report_response',
      'Resposta sobre sua Denúncia',
      'Sua denúncia sobre o projeto "' || project_title || '" foi analisada. Resposta: ' || NEW.admin_response,
      NEW.project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_response
  AFTER UPDATE ON public.project_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_report_response();