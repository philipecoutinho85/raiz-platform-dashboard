-- Reverter o último reembolso aprovado para solicitado
UPDATE refund_requests 
SET status = 'solicitado', updated_at = now(), analyzed_at = null, analyzed_by = null
WHERE id = 'b28bec5a-fd59-41f2-b581-a50169b9cb8b';