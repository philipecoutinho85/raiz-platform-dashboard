-- Adicionar campos para Stripe Connect no profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Criar tabela para rastrear saldo e payouts
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  amount INTEGER NOT NULL, -- em centavos
  stripe_payout_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Habilitar RLS
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para creator_payouts
CREATE POLICY "Users can view their own payouts"
ON public.creator_payouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payouts"
ON public.creator_payouts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert payouts"
ON public.creator_payouts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update payouts"
ON public.creator_payouts
FOR UPDATE
USING (true);

-- Adicionar taxa da plataforma configurável por projeto (em porcentagem)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5,2) DEFAULT 10.00;

-- Criar tabela para pagamentos via Stripe
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- em centavos
  platform_fee INTEGER NOT NULL, -- em centavos
  creator_amount INTEGER NOT NULL, -- em centavos
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own payments"
ON public.stripe_payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments"
ON public.stripe_payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update payments"
ON public.stripe_payments
FOR UPDATE
USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_creator_payouts_user_id ON public.creator_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_project_id ON public.stripe_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON public.profiles(stripe_account_id);