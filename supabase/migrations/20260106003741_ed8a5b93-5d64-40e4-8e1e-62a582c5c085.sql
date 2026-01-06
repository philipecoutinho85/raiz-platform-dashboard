-- Habilitar realtime para tabelas de tokens e transações
ALTER TABLE user_tokens REPLICA IDENTITY FULL;
ALTER TABLE token_purchases REPLICA IDENTITY FULL;
ALTER TABLE token_transactions REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação de realtime (se não estiverem)
DO $$
BEGIN
  -- user_tokens
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_tokens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_tokens;
  END IF;
  
  -- token_purchases
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'token_purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE token_purchases;
  END IF;
  
  -- token_transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'token_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE token_transactions;
  END IF;
END $$;