-- Adicionar campos para rastrear vencimento de boletos
ALTER TABLE token_purchases 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'card',
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Criar índice para consultas de boletos pendentes
CREATE INDEX IF NOT EXISTS idx_token_purchases_pending_boletos 
ON token_purchases (status, payment_type, expires_at) 
WHERE status = 'pending' AND payment_type = 'boleto';