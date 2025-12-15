-- Corrigir saldo do usuário phcoutinho85@gmail.com que recebeu tokens antes do boleto ser pago
-- Reverter a compra 387a6a9b-c081-4d52-9705-7a0d9e8da22c para pending

-- 1. Atualizar status da compra para pending (boleto ainda não pago)
UPDATE token_purchases 
SET status = 'pending', updated_at = now()
WHERE id = '387a6a9b-c081-4d52-9705-7a0d9e8da22c';

-- 2. Remover a transação de tokens indevida
DELETE FROM token_transactions 
WHERE id = '985d3c83-ad5a-4be2-89aa-4dfc41c43b58';

-- 3. Corrigir saldo do usuário (remover os 5 tokens creditados indevidamente)
UPDATE user_tokens 
SET balance = balance - 5, updated_at = now()
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';

-- 4. Remover notificação de compra confirmada (se existir)
DELETE FROM notifications 
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e' 
AND type = 'token_purchase' 
AND related_id = '387a6a9b-c081-4d52-9705-7a0d9e8da22c';