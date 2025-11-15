-- Atualizar função para não devolver tokens quando projeto atingir 100%
CREATE OR REPLACE FUNCTION public.refund_tokens_on_project_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  contribution_record RECORD;
  project_completed BOOLEAN;
BEGIN
  -- Verificar se o projeto atingiu 100% da meta
  project_completed := (OLD.raised_amount >= OLD.goal);
  
  -- Se o projeto atingiu 100%, não devolver tokens
  IF project_completed THEN
    RETURN OLD;
  END IF;

  -- Se não atingiu 100%, devolver tokens aos apoiadores
  FOR contribution_record IN 
    SELECT user_id, amount 
    FROM project_contributions 
    WHERE project_id = OLD.id AND status = 'completed'
  LOOP
    -- Atualizar saldo do usuário
    UPDATE user_tokens 
    SET balance = balance + contribution_record.amount,
        updated_at = now()
    WHERE user_id = contribution_record.user_id;

    -- Criar transação de devolução
    INSERT INTO token_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      balance_after,
      reference_id
    )
    SELECT 
      contribution_record.user_id,
      contribution_record.amount,
      'refund',
      'Devolução de tokens - Projeto excluído: ' || OLD.title,
      ut.balance,
      OLD.id
    FROM user_tokens ut
    WHERE ut.user_id = contribution_record.user_id;

    -- Criar notificação para o apoiador
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_id
    ) VALUES (
      contribution_record.user_id,
      'Tokens Devolvidos',
      'Seus ' || contribution_record.amount || ' tokens do projeto "' || OLD.title || '" foram devolvidos.',
      'refund',
      OLD.id
    );
  END LOOP;

  RETURN OLD;
END;
$$;

-- Atualizar trigger para projetos cancelados
DROP TRIGGER IF EXISTS process_refunds_on_project_cancel ON projects;

CREATE OR REPLACE FUNCTION public.process_refunds_on_project_cancel()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  contribution_record RECORD;
  project_completed BOOLEAN;
BEGIN
  -- Só processar se o status mudou para 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Verificar se o projeto atingiu 100% da meta
    project_completed := (NEW.raised_amount >= NEW.goal);
    
    -- Se o projeto atingiu 100%, não devolver tokens
    IF project_completed THEN
      RETURN NEW;
    END IF;

    -- Se não atingiu 100%, devolver tokens aos apoiadores
    FOR contribution_record IN 
      SELECT user_id, amount, id
      FROM project_contributions 
      WHERE project_id = NEW.id AND status = 'completed'
    LOOP
      -- Atualizar saldo do usuário
      UPDATE user_tokens 
      SET balance = balance + contribution_record.amount,
          updated_at = now()
      WHERE user_id = contribution_record.user_id;

      -- Criar transação de devolução
      INSERT INTO token_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        balance_after,
        reference_id
      )
      SELECT 
        contribution_record.user_id,
        contribution_record.amount,
        'refund',
        'Devolução de tokens - Projeto cancelado: ' || NEW.title,
        ut.balance,
        NEW.id
      FROM user_tokens ut
      WHERE ut.user_id = contribution_record.user_id;

      -- Criar registro de reembolso
      INSERT INTO refunds (
        user_id,
        project_id,
        contribution_id,
        amount,
        reason,
        status,
        processed_at,
        processed_by
      ) VALUES (
        contribution_record.user_id,
        NEW.id,
        contribution_record.id,
        contribution_record.amount,
        'Projeto cancelado',
        'completed',
        now(),
        NEW.reviewed_by
      );

      -- Criar notificação para o apoiador
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        related_id
      ) VALUES (
        contribution_record.user_id,
        'Tokens Devolvidos',
        'Seus ' || contribution_record.amount || ' tokens do projeto "' || NEW.title || '" foram devolvidos porque o projeto foi cancelado.',
        'refund',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER process_refunds_on_project_cancel
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION process_refunds_on_project_cancel();