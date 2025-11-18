-- Criar enum para tipos de admin
CREATE TYPE admin_type AS ENUM ('master', 'financial', 'operational', 'support');

-- Adicionar tipo de admin à tabela user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS admin_type admin_type DEFAULT NULL;

-- Criar tabela de logs de acesso ao painel financeiro
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_type admin_type,
  accessed_route TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_admin_id ON admin_access_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON admin_access_logs(created_at DESC);

-- Criar tabela de alertas financeiros
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'pending_withdrawal', 'high_refund_volume', 'large_purchase', 'unusual_activity', 'fraud_attempt'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID do projeto, usuário ou transação relacionada
  related_type TEXT, -- 'project', 'user', 'transaction', 'withdrawal'
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_alerts_is_read ON financial_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_created_at ON financial_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_severity ON financial_alerts(severity);

-- Criar tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS financial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO financial_settings (key, value) VALUES
  ('admin_fee_percentage', '10'::jsonb),
  ('large_purchase_alert_threshold', '10000'::jsonb),
  ('pending_withdrawal_alert_hours', '48'::jsonb),
  ('session_timeout_minutes', '30'::jsonb),
  ('inactivity_timeout_minutes', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies para admin_access_logs
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins masters podem ver todos os logs"
ON admin_access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.admin_type = 'master'
  )
);

CREATE POLICY "Admins financeiros podem ver logs financeiros"
ON admin_access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.admin_type IN ('master', 'financial')
  )
);

CREATE POLICY "Sistema pode inserir logs"
ON admin_access_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies para financial_alerts
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver alertas financeiros"
ON financial_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar alertas"
ON financial_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Sistema pode criar alertas"
ON financial_alerts FOR INSERT
WITH CHECK (true);

-- RLS Policies para financial_settings
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins masters podem gerenciar configurações"
ON financial_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.admin_type = 'master'
  )
);

CREATE POLICY "Admins podem visualizar configurações"
ON financial_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Função para registrar acesso ao painel
CREATE OR REPLACE FUNCTION log_admin_access(
  p_admin_id UUID,
  p_accessed_route TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_type admin_type;
  v_log_id UUID;
BEGIN
  -- Buscar tipo do admin
  SELECT admin_type INTO v_admin_type
  FROM user_roles
  WHERE user_id = p_admin_id AND role = 'admin'
  LIMIT 1;
  
  -- Inserir log
  INSERT INTO admin_access_logs (
    admin_id,
    admin_type,
    accessed_route,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    p_admin_id,
    v_admin_type,
    p_accessed_route,
    p_ip_address,
    p_user_agent,
    p_session_id
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Função para criar alerta financeiro
CREATE OR REPLACE FUNCTION create_financial_alert(
  p_alert_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO financial_alerts (
    alert_type,
    severity,
    title,
    message,
    related_id,
    related_type,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_related_id,
    p_related_type,
    p_metadata
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;