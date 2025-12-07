-- Tabela para preferências de consentimento do usuário (LGPD)
CREATE TABLE public.user_consent_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  marketing_emails BOOLEAN DEFAULT false,
  new_projects_notifications BOOLEAN DEFAULT true,
  analytics_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para solicitações de exclusão de conta
CREATE TABLE public.account_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days'),
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela interna para registro de atividades de tratamento de dados (LGPD Art. 37)
CREATE TABLE public.data_processing_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processing_purpose TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  legal_basis TEXT NOT NULL,
  retention_period TEXT NOT NULL,
  data_subjects TEXT NOT NULL,
  operators TEXT[],
  international_transfers BOOLEAN DEFAULT false,
  security_measures TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_registry ENABLE ROW LEVEL SECURITY;

-- Políticas para preferências de consentimento
CREATE POLICY "Users can view their own consent preferences"
ON public.user_consent_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent preferences"
ON public.user_consent_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent preferences"
ON public.user_consent_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent preferences"
ON public.user_consent_preferences
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Políticas para solicitações de exclusão
CREATE POLICY "Users can view their own deletion requests"
ON public.account_deletion_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests"
ON public.account_deletion_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own pending deletion requests"
ON public.account_deletion_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all deletion requests"
ON public.account_deletion_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para registro de tratamento (apenas admins)
CREATE POLICY "Admins can manage data processing registry"
ON public.data_processing_registry
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_consent_preferences_updated_at
BEFORE UPDATE ON public.user_consent_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registros iniciais de atividades de tratamento
INSERT INTO public.data_processing_registry (processing_purpose, data_categories, legal_basis, retention_period, data_subjects, operators, security_measures) VALUES
('Cadastro e Autenticação de Usuários', ARRAY['Nome', 'E-mail', 'CPF', 'Telefone', 'Data de Nascimento', 'Endereço'], 'Execução de Contrato (Art. 7º, V LGPD)', '5 anos após encerramento da conta', 'Usuários da plataforma', ARRAY['Supabase (infraestrutura)', 'Pagar.me (pagamentos)'], ARRAY['Criptografia em trânsito (TLS)', 'Criptografia em repouso (AES-256)', 'Controle de acesso baseado em função', 'Logs de auditoria']),
('Processamento de Pagamentos', ARRAY['Dados bancários', 'CPF', 'Valor das transações'], 'Execução de Contrato (Art. 7º, V LGPD)', '10 anos (obrigação fiscal)', 'Criadores e Apoiadores', ARRAY['Pagar.me'], ARRAY['Tokenização de dados de cartão', 'PCI-DSS Compliance', 'Monitoramento de fraudes']),
('Comunicação com Usuários', ARRAY['E-mail', 'Nome'], 'Consentimento (Art. 7º, I LGPD)', 'Até revogação do consentimento', 'Usuários com consentimento ativo', ARRAY['Mailgun'], ARRAY['Opt-out disponível', 'Preferências gerenciáveis']),
('Analytics e Melhoria da Plataforma', ARRAY['Dados de navegação', 'IP', 'Dispositivo'], 'Interesse Legítimo (Art. 7º, IX LGPD)', '24 meses', 'Visitantes e usuários', ARRAY['Google Analytics'], ARRAY['Anonimização de IP', 'Dados agregados', 'Consentimento via cookies']),
('Prevenção a Fraudes', ARRAY['IP', 'Dispositivo', 'Padrões de uso', 'CPF'], 'Interesse Legítimo (Art. 7º, IX LGPD)', '5 anos', 'Todos os usuários', NULL, ARRAY['Detecção de anomalias', 'Bloqueio automático', 'Logs de segurança']),
('Cumprimento de Obrigações Legais', ARRAY['Transações financeiras', 'Dados fiscais', 'CPF'], 'Obrigação Legal (Art. 7º, II LGPD)', 'Conforme legislação específica (5-10 anos)', 'Criadores', NULL, ARRAY['Backup criptografado', 'Acesso restrito', 'Auditoria']);