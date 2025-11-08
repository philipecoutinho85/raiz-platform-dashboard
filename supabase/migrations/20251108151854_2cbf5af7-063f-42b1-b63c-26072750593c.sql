-- Adicionar campos para prestação de contas nos projetos
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS accountability_report TEXT,
ADD COLUMN IF NOT EXISTS accountability_images TEXT[],
ADD COLUMN IF NOT EXISTS accountability_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accountability_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_new_project BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_fee_percentage NUMERIC DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS custom_goal NUMERIC;

-- Criar tabela para configurações do Google Analytics
CREATE TABLE IF NOT EXISTS public.google_analytics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtag_script TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.google_analytics_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para google_analytics_settings
CREATE POLICY "Admins can manage Google Analytics settings"
ON public.google_analytics_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view Google Analytics settings"
ON public.google_analytics_settings
FOR SELECT
USING (true);

-- Função para notificar autor sobre prestação de contas
CREATE OR REPLACE FUNCTION notify_accountability_required()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Quando projeto bate a meta e é aprovado
  IF NEW.status = 'approved' AND NEW.raised_amount >= NEW.goal AND OLD.raised_amount < OLD.goal THEN
    -- Notificar o autor do projeto
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'accountability_required',
      'Prestação de Contas Obrigatória',
      'Parabéns! Seu projeto "' || NEW.title || '" atingiu a meta. Agora você precisa fazer a prestação de contas para poder criar novos projetos.',
      NEW.id
    );
    
    -- Marcar que precisa prestar contas
    NEW.can_create_new_project := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar prestação de contas
DROP TRIGGER IF EXISTS trigger_notify_accountability ON public.projects;
CREATE TRIGGER trigger_notify_accountability
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION notify_accountability_required();