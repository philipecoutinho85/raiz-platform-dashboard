-- Habilitar realtime para a tabela user_tokens
ALTER TABLE public.user_tokens REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tokens;