
-- Corrigir o saldo do usuário que teve reembolso realizado sem subtração de tokens
-- Usuário: phcoutinho85@gmail.com (user_id: 1f769bb5-03e9-41d2-9187-b731d8e9468e)
-- Reembolso: bb9893f9-345b-4e79-8097-b82fa231c37b (5 tokens, status: realizado)

-- 1. Subtrair os 5 tokens do saldo atual
UPDATE user_tokens 
SET balance = balance - 5, updated_at = now()
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';

-- 2. Registrar a transação de reembolso que faltou
INSERT INTO token_transactions (
  user_id, 
  amount, 
  transaction_type, 
  description, 
  balance_after, 
  reference_id
)
SELECT 
  '1f769bb5-03e9-41d2-9187-b731d8e9468e',
  -5,
  'refund',
  'Reembolso aprovado - 5 tokens (correção automática)',
  ut.balance - 5,
  'bb9893f9-345b-4e79-8097-b82fa231c37b'
FROM user_tokens ut
WHERE ut.user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';
