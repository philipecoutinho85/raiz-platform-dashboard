-- Corrigir saldo do usuário phcoutinho85@gmail.com (remover 5 tokens dados erroneamente)
UPDATE user_tokens 
SET balance = balance - 5, updated_at = now()
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';

-- Registrar a correção na transação
INSERT INTO token_transactions (user_id, amount, balance_after, transaction_type, description)
SELECT 
  '1f769bb5-03e9-41d2-9187-b731d8e9468e',
  -5,
  (SELECT balance FROM user_tokens WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e'),
  'adjustment',
  'Correção administrativa: remoção de 5 tokens creditados erroneamente em reembolso';