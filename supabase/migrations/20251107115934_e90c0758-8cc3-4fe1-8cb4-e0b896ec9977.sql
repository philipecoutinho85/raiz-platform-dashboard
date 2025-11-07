-- Habilitar realtime para a tabela token_purchases
ALTER TABLE public.token_purchases REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime (se ainda não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_purchases;