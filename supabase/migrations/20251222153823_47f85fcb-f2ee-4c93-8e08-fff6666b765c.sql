
-- =============================================
-- LEDGER FINANCEIRO - SISTEMA CENTRAL DE CONTABILIDADE
-- =============================================

-- 1. Tabela principal do Ledger Financeiro (registros imutáveis)
CREATE TABLE public.financial_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  contribution_id UUID REFERENCES public.project_contributions(id),
  project_id UUID REFERENCES public.projects(id),
  creator_id UUID NOT NULL,
  supporter_id UUID NOT NULL,
  withdrawal_id UUID REFERENCES public.withdrawals(id),
  
  -- Valores financeiros
  token_amount INTEGER NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL,
  
  -- Método de pagamento e taxas Stripe
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card_national', 'card_international', 'boleto', 'pix')),
  stripe_fee_percentage NUMERIC(5,4) NOT NULL DEFAULT 0,
  stripe_fee_fixed NUMERIC(12,2) NOT NULL DEFAULT 0,
  stripe_fee_total NUMERIC(12,2) NOT NULL,
  
  -- Taxa administrativa da plataforma
  platform_fee_percentage NUMERIC(5,2) NOT NULL CHECK (platform_fee_percentage IN (0, 10)),
  platform_fee_amount NUMERIC(12,2) NOT NULL,
  
  -- Valores líquidos
  net_amount_creator NUMERIC(12,2) NOT NULL,
  net_amount_platform NUMERIC(12,2) NOT NULL,
  
  -- Status e controle
  financial_status TEXT NOT NULL DEFAULT 'grace_period' CHECK (financial_status IN (
    'grace_period',      -- Em carência (30 dias)
    'released',          -- Liberado para saque
    'withdrawal_pending', -- Saque solicitado
    'transfer_pending',  -- Transferência em processamento
    'transfer_completed', -- Transferência concluída
    'refunded'           -- Estornado
  )),
  
  -- Controle de carência
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  
  -- Timestamps imutáveis
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Campos para auditoria de exclusão (apenas admin)
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID,
  deletion_reason TEXT,
  is_deleted BOOLEAN DEFAULT false
);

-- 2. Tabela de movimentações do Ledger (entrada/saída/estorno)
CREATE TABLE public.ledger_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ledger_id UUID REFERENCES public.financial_ledger(id),
  
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'contribution_received',  -- Entrada: apoio recebido
    'platform_fee',          -- Comissão da plataforma
    'stripe_fee',            -- Taxa do Stripe
    'creator_credit',        -- Crédito para criador
    'withdrawal_request',    -- Solicitação de saque
    'transfer_completed',    -- Transferência bancária concluída
    'refund',               -- Estorno
    'adjustment'            -- Ajuste manual (apenas admin)
  )),
  
  -- Origem e destino
  from_entity TEXT, -- 'supporter', 'platform', 'stripe', 'creator'
  to_entity TEXT,   -- 'platform', 'stripe', 'creator', 'supporter'
  
  -- Valores
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2),
  
  -- Referências
  reference_type TEXT, -- 'project', 'contribution', 'withdrawal'
  reference_id UUID,
  
  -- Metadados
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de conciliação bancária
CREATE TABLE public.bank_reconciliation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Data da conciliação
  reconciliation_date DATE NOT NULL,
  
  -- Valores esperados (do Stripe)
  stripe_expected_amount NUMERIC(12,2) NOT NULL,
  stripe_transaction_count INTEGER NOT NULL,
  
  -- Valores recebidos (do banco)
  bank_received_amount NUMERIC(12,2),
  bank_transaction_count INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled', 'divergent')),
  divergence_amount NUMERIC(12,2),
  divergence_reason TEXT,
  
  -- Resolução
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  
  -- Metadados
  stripe_data JSONB,
  bank_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de comprovantes de transferência
CREATE TABLE public.transfer_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id),
  ledger_id UUID REFERENCES public.financial_ledger(id),
  
  -- Arquivo do comprovante
  receipt_url TEXT NOT NULL,
  receipt_filename TEXT,
  
  -- Dados da transferência
  transfer_date DATE NOT NULL,
  transfer_amount NUMERIC(12,2) NOT NULL,
  bank_name TEXT,
  account_info TEXT,
  
  -- Quem anexou
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Validação
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID,
  
  notes TEXT
);

-- 5. Tabela de configuração de taxas Stripe
CREATE TABLE public.stripe_fee_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  payment_method TEXT NOT NULL UNIQUE CHECK (payment_method IN ('card_national', 'card_international', 'boleto', 'pix')),
  
  -- Taxas
  percentage_fee NUMERIC(5,4) NOT NULL,
  fixed_fee NUMERIC(12,2) NOT NULL,
  additional_percentage NUMERIC(5,4) DEFAULT 0,
  
  -- Status
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  disabled_reason TEXT,
  
  -- Metadados
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Inserir configuração padrão de taxas do Stripe
INSERT INTO public.stripe_fee_config (payment_method, percentage_fee, fixed_fee, additional_percentage, is_enabled, description) VALUES
  ('card_national', 0.0399, 0.39, 0, true, 'Cartão Nacional: 3,99% + R$ 0,39'),
  ('card_international', 0.0399, 0.39, 0.02, true, 'Cartão Internacional: 3,99% + R$ 0,39 + 2%'),
  ('boleto', 0, 3.45, 0, true, 'Boleto: R$ 3,45 fixo'),
  ('pix', 0.0119, 0, 0, false, 'PIX: 1,19% - DESABILITADO (Stripe ainda não liberou)');

-- 6. Log de auditoria para exclusões do ledger
CREATE TABLE public.ledger_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  ledger_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('soft_delete', 'restore', 'adjustment')),
  
  -- Quem executou
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Autenticação
  two_factor_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Detalhes
  reason TEXT NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  
  -- Contexto
  ip_address TEXT,
  user_agent TEXT
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_financial_ledger_project ON public.financial_ledger(project_id);
CREATE INDEX idx_financial_ledger_creator ON public.financial_ledger(creator_id);
CREATE INDEX idx_financial_ledger_supporter ON public.financial_ledger(supporter_id);
CREATE INDEX idx_financial_ledger_status ON public.financial_ledger(financial_status);
CREATE INDEX idx_financial_ledger_grace_period ON public.financial_ledger(grace_period_ends_at) WHERE financial_status = 'grace_period';
CREATE INDEX idx_financial_ledger_not_deleted ON public.financial_ledger(id) WHERE is_deleted = false;

CREATE INDEX idx_ledger_movements_ledger ON public.ledger_movements(ledger_id);
CREATE INDEX idx_ledger_movements_type ON public.ledger_movements(movement_type);
CREATE INDEX idx_ledger_movements_date ON public.ledger_movements(created_at);

CREATE INDEX idx_bank_reconciliation_date ON public.bank_reconciliation(reconciliation_date);
CREATE INDEX idx_bank_reconciliation_status ON public.bank_reconciliation(status);

CREATE INDEX idx_transfer_receipts_withdrawal ON public.transfer_receipts(withdrawal_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para financial_ledger
CREATE POLICY "Admins podem ver todo o ledger" ON public.financial_ledger
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir no ledger" ON public.financial_ledger
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Apenas admins master podem soft delete" ON public.financial_ledger
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND admin_type = 'master'
    )
  );

CREATE POLICY "Criadores podem ver seus próprios registros" ON public.financial_ledger
  FOR SELECT USING (auth.uid() = creator_id);

-- Políticas para ledger_movements
CREATE POLICY "Admins podem ver movimentações" ON public.ledger_movements
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir movimentações" ON public.ledger_movements
  FOR INSERT WITH CHECK (true);

-- Políticas para bank_reconciliation
CREATE POLICY "Admins financeiros podem gerenciar conciliação" ON public.bank_reconciliation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND admin_type IN ('master', 'financial')
    )
  );

-- Políticas para transfer_receipts
CREATE POLICY "Admins podem gerenciar comprovantes" ON public.transfer_receipts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Criadores podem ver seus comprovantes" ON public.transfer_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM withdrawals w
      WHERE w.id = transfer_receipts.withdrawal_id
      AND w.user_id = auth.uid()
    )
  );

-- Políticas para stripe_fee_config
CREATE POLICY "Admins podem ver config de taxas" ON public.stripe_fee_config
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins master podem alterar taxas" ON public.stripe_fee_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND admin_type = 'master'
    )
  );

-- Políticas para ledger_audit_log
CREATE POLICY "Apenas admins master podem ver audit log" ON public.ledger_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND admin_type = 'master'
    )
  );

CREATE POLICY "Sistema pode inserir audit log" ON public.ledger_audit_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para calcular taxa do Stripe
CREATE OR REPLACE FUNCTION public.calculate_stripe_fee(
  p_amount NUMERIC,
  p_payment_method TEXT
)
RETURNS TABLE (
  fee_percentage NUMERIC,
  fee_fixed NUMERIC,
  fee_total NUMERIC,
  net_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config
  FROM stripe_fee_config
  WHERE payment_method = p_payment_method
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Método de pagamento não encontrado ou desabilitado: %', p_payment_method;
  END IF;
  
  fee_percentage := v_config.percentage_fee + COALESCE(v_config.additional_percentage, 0);
  fee_fixed := v_config.fixed_fee;
  fee_total := ROUND((p_amount * fee_percentage) + fee_fixed, 2);
  net_amount := p_amount - fee_total;
  
  RETURN NEXT;
END;
$$;

-- Função para criar registro no ledger
CREATE OR REPLACE FUNCTION public.create_ledger_entry(
  p_contribution_id UUID,
  p_project_id UUID,
  p_creator_id UUID,
  p_supporter_id UUID,
  p_token_amount INTEGER,
  p_gross_amount NUMERIC,
  p_payment_method TEXT,
  p_platform_fee_percentage NUMERIC,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stripe_fee RECORD;
  v_platform_fee NUMERIC;
  v_net_creator NUMERIC;
  v_net_platform NUMERIC;
  v_ledger_id UUID;
  v_grace_period_ends TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular taxa do Stripe
  SELECT * INTO v_stripe_fee FROM calculate_stripe_fee(p_gross_amount, p_payment_method);
  
  -- Calcular taxa da plataforma (sobre o valor líquido após Stripe)
  v_platform_fee := ROUND(v_stripe_fee.net_amount * (p_platform_fee_percentage / 100), 2);
  
  -- Valor líquido do criador
  v_net_creator := v_stripe_fee.net_amount - v_platform_fee;
  
  -- Valor líquido da plataforma (comissão)
  v_net_platform := v_platform_fee;
  
  -- Período de carência: 30 dias após criação
  v_grace_period_ends := now() + INTERVAL '30 days';
  
  -- Inserir no ledger
  INSERT INTO financial_ledger (
    contribution_id,
    project_id,
    creator_id,
    supporter_id,
    token_amount,
    gross_amount,
    payment_method,
    stripe_fee_percentage,
    stripe_fee_fixed,
    stripe_fee_total,
    platform_fee_percentage,
    platform_fee_amount,
    net_amount_creator,
    net_amount_platform,
    financial_status,
    grace_period_ends_at,
    stripe_payment_intent_id,
    stripe_session_id
  ) VALUES (
    p_contribution_id,
    p_project_id,
    p_creator_id,
    p_supporter_id,
    p_token_amount,
    p_gross_amount,
    p_payment_method,
    v_stripe_fee.fee_percentage,
    v_stripe_fee.fee_fixed,
    v_stripe_fee.fee_total,
    p_platform_fee_percentage,
    v_platform_fee,
    v_net_creator,
    v_net_platform,
    'grace_period',
    v_grace_period_ends,
    p_stripe_payment_intent_id,
    p_stripe_session_id
  ) RETURNING id INTO v_ledger_id;
  
  -- Criar movimentações
  -- 1. Entrada do apoio
  INSERT INTO ledger_movements (ledger_id, movement_type, from_entity, to_entity, amount, description, reference_type, reference_id)
  VALUES (v_ledger_id, 'contribution_received', 'supporter', 'platform', p_gross_amount, 'Apoio recebido', 'contribution', p_contribution_id);
  
  -- 2. Taxa Stripe
  INSERT INTO ledger_movements (ledger_id, movement_type, from_entity, to_entity, amount, description)
  VALUES (v_ledger_id, 'stripe_fee', 'platform', 'stripe', v_stripe_fee.fee_total, 'Taxa Stripe: ' || p_payment_method);
  
  -- 3. Comissão da plataforma
  IF v_platform_fee > 0 THEN
    INSERT INTO ledger_movements (ledger_id, movement_type, from_entity, to_entity, amount, description)
    VALUES (v_ledger_id, 'platform_fee', 'platform', 'platform', v_platform_fee, 'Comissão da plataforma: ' || p_platform_fee_percentage || '%');
  END IF;
  
  -- 4. Crédito para criador
  INSERT INTO ledger_movements (ledger_id, movement_type, from_entity, to_entity, amount, description, reference_type, reference_id)
  VALUES (v_ledger_id, 'creator_credit', 'platform', 'creator', v_net_creator, 'Crédito liberado para criador', 'project', p_project_id);
  
  RETURN v_ledger_id;
END;
$$;

-- Função para liberar valores após carência
CREATE OR REPLACE FUNCTION public.release_grace_period_funds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE financial_ledger
  SET 
    financial_status = 'released',
    released_at = now()
  WHERE 
    financial_status = 'grace_period'
    AND grace_period_ends_at <= now()
    AND is_deleted = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Função para soft delete com auditoria
CREATE OR REPLACE FUNCTION public.soft_delete_ledger_entry(
  p_ledger_id UUID,
  p_reason TEXT,
  p_two_factor_verified BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_data JSONB;
BEGIN
  -- Verificar se usuário é admin master
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_type = 'master'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores master podem excluir registros do ledger';
  END IF;
  
  -- Verificar 2FA
  IF NOT p_two_factor_verified THEN
    RAISE EXCEPTION 'Autenticação de dois fatores obrigatória para esta operação';
  END IF;
  
  -- Capturar dados anteriores
  SELECT to_jsonb(fl.*) INTO v_previous_data
  FROM financial_ledger fl
  WHERE id = p_ledger_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro não encontrado';
  END IF;
  
  -- Soft delete
  UPDATE financial_ledger
  SET 
    is_deleted = true,
    deleted_at = now(),
    deleted_by = auth.uid(),
    deletion_reason = p_reason
  WHERE id = p_ledger_id;
  
  -- Log de auditoria
  INSERT INTO ledger_audit_log (
    ledger_id,
    action,
    performed_by,
    two_factor_verified,
    reason,
    previous_data
  ) VALUES (
    p_ledger_id,
    'soft_delete',
    auth.uid(),
    p_two_factor_verified,
    p_reason,
    v_previous_data
  );
  
  RETURN true;
END;
$$;

-- View para resumo financeiro por projeto
CREATE OR REPLACE VIEW public.project_financial_summary AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.user_id AS creator_id,
  pr.nome || ' ' || pr.sobrenome AS creator_name,
  p.goal,
  p.raised_amount,
  CASE WHEN p.raised_amount >= p.goal THEN true ELSE false END AS goal_reached,
  
  -- Totais do ledger
  COALESCE(SUM(fl.gross_amount) FILTER (WHERE NOT fl.is_deleted), 0) AS total_gross,
  COALESCE(SUM(fl.stripe_fee_total) FILTER (WHERE NOT fl.is_deleted), 0) AS total_stripe_fees,
  COALESCE(SUM(fl.platform_fee_amount) FILTER (WHERE NOT fl.is_deleted), 0) AS total_platform_fees,
  COALESCE(SUM(fl.net_amount_creator) FILTER (WHERE NOT fl.is_deleted), 0) AS total_net_creator,
  
  -- Status
  COUNT(*) FILTER (WHERE fl.financial_status = 'grace_period' AND NOT fl.is_deleted) AS in_grace_period,
  COUNT(*) FILTER (WHERE fl.financial_status = 'released' AND NOT fl.is_deleted) AS released,
  COUNT(*) FILTER (WHERE fl.financial_status = 'withdrawal_pending' AND NOT fl.is_deleted) AS withdrawal_pending,
  COUNT(*) FILTER (WHERE fl.financial_status = 'transfer_completed' AND NOT fl.is_deleted) AS transfer_completed,
  
  -- Valores por status
  COALESCE(SUM(fl.net_amount_creator) FILTER (WHERE fl.financial_status = 'grace_period' AND NOT fl.is_deleted), 0) AS amount_in_grace,
  COALESCE(SUM(fl.net_amount_creator) FILTER (WHERE fl.financial_status = 'released' AND NOT fl.is_deleted), 0) AS amount_released,
  COALESCE(SUM(fl.net_amount_creator) FILTER (WHERE fl.financial_status IN ('withdrawal_pending', 'transfer_pending') AND NOT fl.is_deleted), 0) AS amount_pending_transfer,
  COALESCE(SUM(fl.net_amount_creator) FILTER (WHERE fl.financial_status = 'transfer_completed' AND NOT fl.is_deleted), 0) AS amount_transferred,
  
  -- Próxima liberação
  MIN(fl.grace_period_ends_at) FILTER (WHERE fl.financial_status = 'grace_period' AND NOT fl.is_deleted) AS next_release_date

FROM projects p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN financial_ledger fl ON fl.project_id = p.id
WHERE p.status = 'approved'
GROUP BY p.id, p.title, p.user_id, pr.nome, pr.sobrenome, p.goal, p.raised_amount;
