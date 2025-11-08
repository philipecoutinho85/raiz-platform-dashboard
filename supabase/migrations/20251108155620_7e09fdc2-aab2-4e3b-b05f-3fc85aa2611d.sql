-- Criar tabela para badges de projetos
CREATE TABLE IF NOT EXISTS public.project_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, badge_id)
);

-- Habilitar RLS
ALTER TABLE public.project_badges ENABLE ROW LEVEL SECURITY;

-- Políticas para project_badges
CREATE POLICY "Anyone can view project badges"
ON public.project_badges
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage project badges"
ON public.project_badges
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Habilitar realtime para notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;