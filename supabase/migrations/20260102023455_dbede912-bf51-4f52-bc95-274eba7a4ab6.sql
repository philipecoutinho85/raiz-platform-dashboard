-- Adicionar políticas de DELETE para admin master nas tabelas financeiras

-- token_purchases
CREATE POLICY "Admin master can delete token_purchases" 
ON public.token_purchases 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- token_transactions
CREATE POLICY "Admin master can delete token_transactions" 
ON public.token_transactions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- project_contributions
CREATE POLICY "Admin master can delete project_contributions" 
ON public.project_contributions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- refunds
CREATE POLICY "Admin master can delete refunds" 
ON public.refunds 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- withdrawals
CREATE POLICY "Admin master can delete withdrawals" 
ON public.withdrawals 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- withdrawal_messages (precisa deletar antes de withdrawals)
CREATE POLICY "Admin master can delete withdrawal_messages" 
ON public.withdrawal_messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- creator_payouts
CREATE POLICY "Admin master can delete creator_payouts" 
ON public.creator_payouts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- financial_ledger - já tem políticas de update/soft-delete, adicionar delete
CREATE POLICY "Admin master can delete financial_ledger" 
ON public.financial_ledger 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- ledger_movements
CREATE POLICY "Admin master can delete ledger_movements" 
ON public.ledger_movements 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- financial_alerts
CREATE POLICY "Admin master can delete financial_alerts" 
ON public.financial_alerts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);

-- user_tokens - adicionar política de update para admin master zerar saldos
CREATE POLICY "Admin master can update user_tokens" 
ON public.user_tokens 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin' 
    AND user_roles.admin_type = 'master'
  )
);