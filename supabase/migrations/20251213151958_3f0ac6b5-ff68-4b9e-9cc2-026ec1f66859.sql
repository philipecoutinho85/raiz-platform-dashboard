-- Add policy for admins to update user_tokens
CREATE POLICY "Admins can update user_tokens" 
ON public.user_tokens 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to insert user_tokens
CREATE POLICY "Admins can insert user_tokens" 
ON public.user_tokens 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Credit the 5 tokens to the user now
UPDATE public.user_tokens 
SET balance = balance + 5, updated_at = now()
WHERE user_id = '1f769bb5-03e9-41d2-9187-b731d8e9468e';

-- Create transaction record
INSERT INTO public.token_transactions (user_id, amount, transaction_type, description, balance_after)
VALUES (
  '1f769bb5-03e9-41d2-9187-b731d8e9468e',
  5,
  'credit',
  'Crédito manual - Correção de pagamento Stripe',
  5
);