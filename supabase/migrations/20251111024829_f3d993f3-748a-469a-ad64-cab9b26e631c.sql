-- Criar função para atualizar updated_at (caso não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de solicitações de resgate
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  user_id UUID NOT NULL,
  requested_amount NUMERIC NOT NULL,
  admin_fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_account JSONB NOT NULL,
  pagarme_recipient_id TEXT,
  pagarme_transfer_id TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Criar índices
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_project_id ON public.withdrawals(project_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para notificar admins sobre novo resgate
CREATE OR REPLACE FUNCTION public.notify_admins_new_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
      'new_withdrawal',
      'Nova Solicitação de Resgate',
      'Resgate de R$ ' || NEW.net_amount || ' solicitado para o projeto "' || project_title || '"',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_withdrawal
AFTER INSERT ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_withdrawal();

-- Função para notificar autor sobre decisão de resgate
CREATE OR REPLACE FUNCTION public.notify_withdrawal_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Pegar título do projeto
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- Notificar o autor
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'withdrawal_decision',
      CASE 
        WHEN NEW.status = 'approved' THEN 'Resgate Aprovado!'
        ELSE 'Resgate Rejeitado'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 
          'Seu resgate de R$ ' || NEW.net_amount || ' do projeto "' || project_title || '" foi aprovado e está sendo processado.'
        ELSE 
          'Seu resgate do projeto "' || project_title || '" foi rejeitado. Motivo: ' || COALESCE(NEW.rejection_reason, 'Não especificado')
      END,
      NEW.project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_withdrawal_decision
AFTER UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.notify_withdrawal_decision();