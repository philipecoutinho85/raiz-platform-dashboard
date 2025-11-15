-- Adicionar ON DELETE CASCADE às foreign keys relacionadas a projetos
-- Isso permite que quando um projeto for deletado, todos os registros relacionados sejam deletados automaticamente

-- 1. Recriar foreign key de project_contributions
ALTER TABLE public.project_contributions 
DROP CONSTRAINT IF EXISTS project_contributions_project_id_fkey;

ALTER TABLE public.project_contributions
ADD CONSTRAINT project_contributions_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. Recriar foreign key de project_images
ALTER TABLE public.project_images 
DROP CONSTRAINT IF EXISTS project_images_project_id_fkey;

ALTER TABLE public.project_images
ADD CONSTRAINT project_images_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 3. Recriar foreign key de project_gallery
ALTER TABLE public.project_gallery 
DROP CONSTRAINT IF EXISTS project_gallery_project_id_fkey;

ALTER TABLE public.project_gallery
ADD CONSTRAINT project_gallery_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 4. Recriar foreign key de project_comments
ALTER TABLE public.project_comments 
DROP CONSTRAINT IF EXISTS project_comments_project_id_fkey;

ALTER TABLE public.project_comments
ADD CONSTRAINT project_comments_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 5. Recriar foreign key de project_badges
ALTER TABLE public.project_badges 
DROP CONSTRAINT IF EXISTS project_badges_project_id_fkey;

ALTER TABLE public.project_badges
ADD CONSTRAINT project_badges_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 6. Recriar foreign key de withdrawals
ALTER TABLE public.withdrawals 
DROP CONSTRAINT IF EXISTS withdrawals_project_id_fkey;

ALTER TABLE public.withdrawals
ADD CONSTRAINT withdrawals_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 7. Recriar foreign key de refunds
ALTER TABLE public.refunds 
DROP CONSTRAINT IF EXISTS refunds_project_id_fkey;

ALTER TABLE public.refunds
ADD CONSTRAINT refunds_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 8. Recriar foreign key de project_reports (denúncias)
ALTER TABLE public.project_reports 
DROP CONSTRAINT IF EXISTS project_reports_project_id_fkey;

ALTER TABLE public.project_reports
ADD CONSTRAINT project_reports_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Criar função para devolver tokens automaticamente quando um projeto for excluído
CREATE OR REPLACE FUNCTION public.refund_tokens_on_project_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contribution RECORD;
  current_balance INTEGER;
BEGIN
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
        'Devolução automática - Projeto "' || OLD.title || '" foi excluído',
        current_balance + contribution.amount
      );
      
      -- Criar notificação para o usuário
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        contribution.user_id,
        'project_deleted',
        'Tokens Devolvidos',
        'O projeto "' || OLD.title || '" foi excluído. Seus ' || contribution.amount || ' tokens foram devolvidos automaticamente.',
        OLD.id
      );
    END IF;
  END LOOP;
  
  RETURN OLD;
END;
$$;

-- Criar trigger para executar a função antes de deletar um projeto
DROP TRIGGER IF EXISTS refund_tokens_before_project_delete ON public.projects;

CREATE TRIGGER refund_tokens_before_project_delete
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_tokens_on_project_delete();