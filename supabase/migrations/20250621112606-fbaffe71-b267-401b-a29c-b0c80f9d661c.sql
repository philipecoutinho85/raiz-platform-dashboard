
-- Adicionar o usuário Philipe Coutinho como administrador
-- Primeiro, vamos buscar se o usuário já existe e adicionar a role de admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'philipecoutinhor@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id AND role = 'admin'
);

-- Criar uma tabela para gerenciar tokens dos usuários
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Habilitar RLS na tabela de tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios tokens
CREATE POLICY "Users can view their own tokens" 
    ON public.user_tokens 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas seus próprios tokens
CREATE POLICY "Users can update their own tokens" 
    ON public.user_tokens 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política para inserção automática de tokens
CREATE POLICY "Users can insert their own tokens" 
    ON public.user_tokens 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Função para criar registro de tokens quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Inserir registro de tokens com saldo 0 para novos usuários
    INSERT INTO public.user_tokens (user_id, balance)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$;

-- Trigger para criar tokens automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_tokens();
