-- Criar tabela para códigos de verificação de resgate
CREATE TABLE IF NOT EXISTS public.withdrawal_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar códigos rapidamente
CREATE INDEX idx_withdrawal_verification_codes_withdrawal ON public.withdrawal_verification_codes(withdrawal_id);
CREATE INDEX idx_withdrawal_verification_codes_code ON public.withdrawal_verification_codes(code);

-- RLS Policies
ALTER TABLE public.withdrawal_verification_codes ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios códigos
CREATE POLICY "Users can view their own verification codes"
  ON public.withdrawal_verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sistema pode inserir códigos
CREATE POLICY "System can insert verification codes"
  ON public.withdrawal_verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Usuários podem atualizar (marcar como usado) seus próprios códigos
CREATE POLICY "Users can update their own verification codes"
  ON public.withdrawal_verification_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem ver todos os códigos
CREATE POLICY "Admins can view all verification codes"
  ON public.withdrawal_verification_codes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));