-- Criar trigger para atualização automática de badges quando projeto é atualizado
CREATE TRIGGER trigger_update_user_badges
AFTER INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_user_badges();

-- Adicionar campo para comunicação admin-criador
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS pending_requirements text;