-- Tabela de compras de tokens
CREATE TABLE IF NOT EXISTS public.token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- quantidade de tokens
  price NUMERIC NOT NULL, -- valor pago em reais
  payment_method TEXT NOT NULL, -- pix, credit_card, boleto
  pagarme_transaction_id TEXT UNIQUE, -- ID da transação no Pagar.me
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de transações de tokens (histórico completo)
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positivo = crédito, negativo = débito
  transaction_type TEXT NOT NULL, -- purchase, support, refund
  reference_id UUID, -- ID da compra, apoio ou reembolso
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL, -- saldo após a transação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de reembolsos
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  contribution_id UUID REFERENCES public.project_contributions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- quantidade de tokens reembolsados
  reason TEXT NOT NULL, -- project_failed, project_cancelled, manual_request
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, rejected
  requested_by UUID REFERENCES auth.users(id), -- quem solicitou (usuário ou admin)
  processed_by UUID REFERENCES auth.users(id), -- admin que processou
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para token_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.token_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.token_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert purchases"
  ON public.token_purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update purchases"
  ON public.token_purchases FOR UPDATE
  USING (true);

-- Políticas RLS para token_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.token_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert transactions"
  ON public.token_transactions FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para refunds
CREATE POLICY "Users can view their own refunds"
  ON public.refunds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request refunds"
  ON public.refunds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all refunds"
  ON public.refunds FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage refunds"
  ON public.refunds FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX idx_token_purchases_user_id ON public.token_purchases(user_id);
CREATE INDEX idx_token_purchases_status ON public.token_purchases(status);
CREATE INDEX idx_token_purchases_pagarme_id ON public.token_purchases(pagarme_transaction_id);
CREATE INDEX idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX idx_refunds_user_id ON public.refunds(user_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);

-- Função para processar reembolso automático quando projeto falha
CREATE OR REPLACE FUNCTION public.process_automatic_refunds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o projeto foi rejeitado ou cancelado, criar reembolsos automáticos
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status != NEW.status THEN
    INSERT INTO public.refunds (user_id, project_id, contribution_id, amount, reason, status, requested_by)
    SELECT 
      pc.user_id,
      pc.project_id,
      pc.id,
      pc.amount,
      CASE 
        WHEN NEW.status = 'rejected' THEN 'project_failed'
        ELSE 'project_cancelled'
      END,
      'pending',
      NEW.reviewed_by
    FROM public.project_contributions pc
    WHERE pc.project_id = NEW.id
    AND pc.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para reembolsos automáticos
DROP TRIGGER IF EXISTS trigger_automatic_refunds ON public.projects;
CREATE TRIGGER trigger_automatic_refunds
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.process_automatic_refunds();

-- Função para processar reembolso completado
CREATE OR REPLACE FUNCTION public.complete_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Quando o reembolso é completado, devolver tokens e criar transação
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Pegar saldo atual
    SELECT balance INTO current_balance
    FROM public.user_tokens
    WHERE user_id = NEW.user_id;
    
    -- Atualizar saldo
    UPDATE public.user_tokens
    SET balance = balance + NEW.amount,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Criar transação no histórico
    INSERT INTO public.token_transactions (
      user_id, 
      amount, 
      transaction_type, 
      reference_id, 
      description,
      balance_after
    ) VALUES (
      NEW.user_id,
      NEW.amount,
      'refund',
      NEW.id,
      'Reembolso de ' || NEW.amount || ' tokens',
      current_balance + NEW.amount
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para completar reembolso
DROP TRIGGER IF EXISTS trigger_complete_refund ON public.refunds;
CREATE TRIGGER trigger_complete_refund
  AFTER UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_refund();