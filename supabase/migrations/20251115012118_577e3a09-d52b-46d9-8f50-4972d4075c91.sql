-- Atualizar a função de devolução de tokens para só devolver quando projeto não atingiu a meta
CREATE OR REPLACE FUNCTION public.refund_tokens_on_project_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contribution RECORD;
  current_balance INTEGER;
  project_completed BOOLEAN;
BEGIN
  -- Verificar se o projeto atingiu 100% da meta
  project_completed := OLD.raised_amount >= OLD.goal;
  
  -- Só devolver tokens se o projeto NÃO atingiu a meta
  IF NOT project_completed THEN
    -- Para cada contribuição completada no projeto deletado
    FOR contribution IN 
      SELECT user_id, amount, id
      FROM public.project_contributions
      WHERE project_id = OLD.id 
      AND status = 'completed'
    LOOP
      -- Pegar saldo atual do usuário
      SELECT balance INTO current_balance
      FROM public.user_tokens
      WHERE user_id = contribution.user_id;
      
      -- Se o usuário tem registro de tokens, devolver os tokens
      IF current_balance IS NOT NULL THEN
        -- Atualizar saldo
        UPDATE public.user_tokens
        SET balance = balance + contribution.amount,
            updated_at = now()
        WHERE user_id = contribution.user_id;
        
        -- Criar transação no histórico
        INSERT INTO public.token_transactions (
          user_id, 
          amount, 
          transaction_type, 
          reference_id, 
          description,
          balance_after
        ) VALUES (
          contribution.user_id,
          contribution.amount,
          'refund',
          contribution.id,
          'Devolução automática - Projeto "' || OLD.title || '" foi excluído sem atingir a meta',
          current_balance + contribution.amount
        );
        
        -- Criar notificação para o usuário
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        VALUES (
          contribution.user_id,
          'project_deleted_refund',
          'Tokens Devolvidos',
          'O projeto "' || OLD.title || '" foi excluído sem completar a meta. Seus ' || contribution.amount || ' tokens foram devolvidos automaticamente.',
          OLD.id
        );
      END IF;
    END LOOP;
  ELSE
    -- Projeto completou a meta, apenas notificar apoiadores sem devolver tokens
    FOR contribution IN 
      SELECT DISTINCT user_id
      FROM public.project_contributions
      WHERE project_id = OLD.id 
      AND status = 'completed'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        contribution.user_id,
        'project_deleted_completed',
        'Projeto Excluído',
        'O projeto "' || OLD.title || '" que você apoiou foi excluído. Como o projeto havia atingido 100% da meta, os tokens não foram devolvidos.',
        OLD.id
      );
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Adicionar função para processar reembolsos automáticos quando projeto é cancelado
CREATE OR REPLACE FUNCTION public.process_automatic_refunds_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o projeto foi cancelado (não atingiu a meta ainda)
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.raised_amount < NEW.goal THEN
    INSERT INTO public.refunds (user_id, project_id, contribution_id, amount, reason, status, requested_by)
    SELECT 
      pc.user_id,
      pc.project_id,
      pc.id,
      pc.amount,
      'project_cancelled',
      'pending',
      NEW.reviewed_by
    FROM public.project_contributions pc
    WHERE pc.project_id = NEW.id
    AND pc.status = 'completed'
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para reembolsos automáticos quando projeto é cancelado
DROP TRIGGER IF EXISTS process_refunds_on_project_cancel ON public.projects;

CREATE TRIGGER process_refunds_on_project_cancel
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.process_automatic_refunds_on_cancel();