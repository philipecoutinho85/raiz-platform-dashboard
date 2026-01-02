-- Atualizar tokens corretos dos usuários
-- philipecoutinhor@gmail.com: 10 tokens de teste
-- phcoutinho85@gmail.com: 5 tokens comprados com dinheiro real

-- Primeiro atualizar os saldos
UPDATE public.user_tokens 
SET balance = 10 
WHERE user_id = '5098e4ff-0e00-4ff5-a788-47808d067e72';

UPDATE public.user_tokens 
SET balance = 5 
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';