-- Adicionar política para permitir que qualquer pessoa visualize as configurações de redes sociais
CREATE POLICY "Anyone can view social links" 
ON public.system_settings 
FOR SELECT 
USING (key = 'social_links');