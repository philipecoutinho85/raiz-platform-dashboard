-- Adicionar campo de chave PIX na tabela withdrawals
ALTER TABLE public.withdrawals 
ADD COLUMN pix_key TEXT,
ADD COLUMN pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
ADD COLUMN payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'pix'));

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_payment_method ON public.withdrawals(payment_method);

-- Comentários para documentação
COMMENT ON COLUMN public.withdrawals.pix_key IS 'Chave PIX do usuário para recebimento';
COMMENT ON COLUMN public.withdrawals.pix_key_type IS 'Tipo da chave PIX: cpf, cnpj, email, phone, random';
COMMENT ON COLUMN public.withdrawals.payment_method IS 'Método de pagamento escolhido: bank_transfer ou pix';