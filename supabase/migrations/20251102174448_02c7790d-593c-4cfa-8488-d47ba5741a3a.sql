-- Criar tabela de badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  criteria text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  is_manual boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de badges dos usuários
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  granted_at timestamp with time zone DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, badge_id)
);

-- Criar tabela de comentários/feedbacks dos projetos
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_type text NOT NULL CHECK (comment_type IN ('question', 'feedback', 'testimonial')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para badges
CREATE POLICY "Anyone can view active badges"
ON public.badges FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para user_badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage user badges"
ON public.user_badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para project_comments
CREATE POLICY "Anyone can view approved project comments"
ON public.project_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_comments.project_id
    AND projects.status = 'approved'
  )
);

CREATE POLICY "Authenticated users can create comments"
ON public.project_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.project_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.project_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.project_comments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir badges padrão
INSERT INTO public.badges (name, slug, description, criteria, is_manual) VALUES
('Verificado pela Raiz Token', 'verified', 'Confirma identidade e legitimidade', 'Perfil analisado e aprovado pela curadoria', true),
('Curadoria Aprovada', 'curated', 'Garante que o projeto é real e validado', 'Projeto passou na triagem de credibilidade, impacto e viabilidade', true),
('Entrega Comprovada', 'delivery_proven', 'Demonstra que o criador cumpre o que promete', 'Projeto concluído e validado pela equipe', false),
('Confiável', 'trustworthy', 'Reconhecido pela consistência', 'Criador com 2 ou mais projetos concluídos com sucesso', false),
('Top Criador', 'top_creator', 'Alta reputação na comunidade', 'Criador com 5 ou mais projetos entregues e bem avaliados', false);

-- Criar função para atualizar badges automaticamente
CREATE OR REPLACE FUNCTION public.update_user_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completed_projects_count integer;
  trustworthy_badge_id uuid;
  top_creator_badge_id uuid;
  delivery_proven_badge_id uuid;
BEGIN
  -- Contar projetos concluídos do usuário
  SELECT COUNT(*) INTO completed_projects_count
  FROM public.projects
  WHERE user_id = NEW.user_id
  AND status = 'approved'
  AND raised_amount >= goal;

  -- Pegar IDs das badges
  SELECT id INTO trustworthy_badge_id FROM public.badges WHERE slug = 'trustworthy';
  SELECT id INTO top_creator_badge_id FROM public.badges WHERE slug = 'top_creator';
  SELECT id INTO delivery_proven_badge_id FROM public.badges WHERE slug = 'delivery_proven';

  -- Badge "Entrega Comprovada" (1+ projeto concluído)
  IF completed_projects_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (NEW.user_id, delivery_proven_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge "Confiável" (2+ projetos concluídos)
  IF completed_projects_count >= 2 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (NEW.user_id, trustworthy_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge "Top Criador" (5+ projetos concluídos)
  IF completed_projects_count >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (NEW.user_id, top_creator_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar badges quando projeto é atualizado
CREATE TRIGGER update_badges_on_project_update
AFTER UPDATE ON public.projects
FOR EACH ROW
WHEN (NEW.status = 'approved' AND NEW.raised_amount >= NEW.goal)
EXECUTE FUNCTION public.update_user_badges();