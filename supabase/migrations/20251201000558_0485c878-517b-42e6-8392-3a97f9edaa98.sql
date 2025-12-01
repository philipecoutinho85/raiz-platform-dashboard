-- Desabilitar trigger e função database problemáticos que tentam acessar Vault
-- A integração Pagar.me deve usar a Edge Function process-withdrawal, não database function

-- Remover trigger se existir
DROP TRIGGER IF EXISTS on_withdrawal_approved ON withdrawals;

-- Remover função database problemática
DROP FUNCTION IF EXISTS process_withdrawal_pagarme();

-- Garantir que não há outros triggers interferindo
DROP TRIGGER IF EXISTS trigger_process_withdrawal ON withdrawals;

-- Adicionar comentário explicativo
COMMENT ON TABLE withdrawals IS 'Withdrawals são processados via Edge Function process-withdrawal. Não usar database triggers para Pagar.me integration.';
