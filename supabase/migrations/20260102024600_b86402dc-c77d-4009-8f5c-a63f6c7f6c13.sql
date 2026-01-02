
-- Atualizar o admin_type para 'master' para o usuário philipecoutinhor@gmail.com
UPDATE public.user_roles 
SET admin_type = 'master'
WHERE user_id = '5098e4ff-0e00-4ff5-a788-47808d067e72' 
AND role = 'admin';
