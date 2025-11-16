-- Adicionar novo status de verificação pendente para withdrawals
-- Não há constraint de check no status, então não preciso alterar nada
-- Apenas documentar que agora temos um novo status: 'verification_pending'

-- Comentário: O status 'verification_pending' indica que o withdrawal está aguardando
-- verificação do código enviado por email antes de ser processado