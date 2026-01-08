-- Habilitar REPLICA IDENTITY FULL para garantir dados completos em atualizações realtime
ALTER TABLE public.user_tokens REPLICA IDENTITY FULL;