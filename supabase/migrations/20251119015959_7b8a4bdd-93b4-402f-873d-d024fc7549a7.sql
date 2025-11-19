-- Criar tabela de pontuação de criadores (RaizScore)
CREATE TABLE IF NOT EXISTS public.creator_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Detalhamento de pontos por categoria (para auditoria)
  accountability_points INTEGER DEFAULT 0,
  success_history_points INTEGER DEFAULT 0,
  behavior_points INTEGER DEFAULT 0,
  reports_points INTEGER DEFAULT 0,
  engagement_points INTEGER DEFAULT 0,
  delivery_quality_points INTEGER DEFAULT 0,
  platform_time_points INTEGER DEFAULT 0,
  
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.creator_scores ENABLE ROW LEVEL SECURITY;

-- Policies para creator_scores
CREATE POLICY "Anyone can view creator scores"
  ON public.creator_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage creator scores"
  ON public.creator_scores
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can update creator scores"
  ON public.creator_scores
  FOR UPDATE
  USING (true);

CREATE POLICY "System can insert creator scores"
  ON public.creator_scores
  FOR INSERT
  WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_creator_scores_user_id ON public.creator_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_scores_level ON public.creator_scores(level);

-- Função para calcular o nível baseado nos pontos
CREATE OR REPLACE FUNCTION public.calculate_raizscore_level(p_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_points >= 91 THEN
    RETURN 5; -- Criador Premium
  ELSIF p_points >= 66 THEN
    RETURN 4; -- Criador Destaque
  ELSIF p_points >= 41 THEN
    RETURN 3; -- Criador Confiável
  ELSIF p_points >= 21 THEN
    RETURN 2; -- Criador Regular
  ELSE
    RETURN 1; -- Criador Novo
  END IF;
END;
$$;

-- Função para recalcular o RaizScore de um usuário
CREATE OR REPLACE FUNCTION public.recalculate_user_raizscore(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accountability_points INTEGER := 0;
  v_success_points INTEGER := 0;
  v_behavior_points INTEGER := 0;
  v_reports_points INTEGER := 0;
  v_engagement_points INTEGER := 0;
  v_delivery_points INTEGER := 0;
  v_time_points INTEGER := 0;
  v_total_points INTEGER := 0;
  v_level INTEGER;
  v_profile_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 2.1 Prestação de Contas
  SELECT COALESCE(
    SUM(CASE 
      WHEN accountability_approved = true THEN 5
      WHEN accountability_report IS NOT NULL THEN 2
      ELSE 0
    END), 0
  ) INTO v_accountability_points
  FROM projects
  WHERE user_id = p_user_id 
    AND status = 'approved'
    AND raised_amount >= goal;

  -- 2.2 Histórico de Sucesso
  SELECT COALESCE(
    SUM(CASE 
      WHEN raised_amount >= goal THEN 3
      WHEN raised_amount >= goal * 1.0 THEN 1
      ELSE 0
    END), 0
  ) INTO v_success_points
  FROM projects
  WHERE user_id = p_user_id AND status = 'approved';

  -- 2.4 Denúncias (negativas)
  SELECT COALESCE(
    SUM(CASE 
      WHEN status = 'resolved' AND admin_response LIKE '%infundada%' THEN 3
      WHEN status = 'resolved' THEN -7
      WHEN status = 'pending' THEN -3
      ELSE 0
    END), 0
  ) INTO v_reports_points
  FROM project_reports pr
  JOIN projects p ON pr.project_id = p.id
  WHERE p.user_id = p_user_id;

  -- 2.5 Engajamento (apoiadores únicos)
  SELECT COALESCE(COUNT(DISTINCT user_id), 0) INTO v_engagement_points
  FROM project_contributions pc
  JOIN projects p ON pc.project_id = p.id
  WHERE p.user_id = p_user_id AND pc.status = 'completed';

  -- 2.6 Qualidade das Entregas (prestação de contas aprovada)
  SELECT COALESCE(
    SUM(CASE 
      WHEN accountability_approved = true THEN 5
      WHEN accountability_report IS NOT NULL THEN 3
      ELSE 0
    END), 0
  ) INTO v_delivery_points
  FROM projects
  WHERE user_id = p_user_id 
    AND status = 'approved'
    AND raised_amount >= goal;

  -- 2.7 Tempo de Plataforma
  SELECT created_at INTO v_profile_created_at
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile_created_at IS NOT NULL THEN
    -- +1 por mês sem incidentes, +3 ao completar 1 ano
    v_time_points := LEAST(EXTRACT(YEAR FROM AGE(now(), v_profile_created_at))::INTEGER * 12, 12);
    IF EXTRACT(YEAR FROM AGE(now(), v_profile_created_at)) >= 1 THEN
      v_time_points := v_time_points + 3;
    END IF;
  END IF;

  -- Somar todos os pontos
  v_total_points := GREATEST(0, 
    v_accountability_points + 
    v_success_points + 
    v_behavior_points + 
    v_reports_points + 
    v_engagement_points + 
    v_delivery_points + 
    v_time_points
  );

  -- Calcular nível
  v_level := calculate_raizscore_level(v_total_points);

  -- Inserir ou atualizar o score
  INSERT INTO creator_scores (
    user_id, 
    points, 
    level,
    accountability_points,
    success_history_points,
    behavior_points,
    reports_points,
    engagement_points,
    delivery_quality_points,
    platform_time_points,
    last_calculated_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_total_points,
    v_level,
    v_accountability_points,
    v_success_points,
    v_behavior_points,
    v_reports_points,
    v_engagement_points,
    v_delivery_points,
    v_time_points,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    points = EXCLUDED.points,
    level = EXCLUDED.level,
    accountability_points = EXCLUDED.accountability_points,
    success_history_points = EXCLUDED.success_history_points,
    behavior_points = EXCLUDED.behavior_points,
    reports_points = EXCLUDED.reports_points,
    engagement_points = EXCLUDED.engagement_points,
    delivery_quality_points = EXCLUDED.delivery_quality_points,
    platform_time_points = EXCLUDED.platform_time_points,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- Trigger para recalcular RaizScore quando um projeto é atualizado
CREATE OR REPLACE FUNCTION public.trigger_recalculate_raizscore()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_user_raizscore(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_raizscore_on_project_update
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.accountability_approved IS DISTINCT FROM NEW.accountability_approved OR
    OLD.raised_amount IS DISTINCT FROM NEW.raised_amount
  )
  EXECUTE FUNCTION trigger_recalculate_raizscore();

-- Trigger para recalcular quando uma denúncia é processada
CREATE OR REPLACE FUNCTION public.trigger_recalculate_raizscore_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM projects
  WHERE id = NEW.project_id;
  
  IF v_user_id IS NOT NULL THEN
    PERFORM recalculate_user_raizscore(v_user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_raizscore_on_report_update
  AFTER UPDATE ON project_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_recalculate_raizscore_on_report();

-- Inserir badges oficiais do MVP
INSERT INTO public.badges (name, slug, description, criteria, is_manual, is_active, image_url) VALUES
  -- Badges de Credibilidade
  ('Verificado pela Raiz Token', 'verified', 'Criador verificado oficialmente pela equipe Raiz Token', 'Verificação manual pela equipe', true, true, NULL),
  ('Curadoria Aprovada', 'curated', 'Projeto selecionado pela curadoria da plataforma', 'Seleção pela equipe de curadoria', true, true, NULL),
  ('Entrega Comprovada', 'delivery_proven', 'Comprovou a entrega de pelo menos um projeto', 'Primeira prestação de contas aprovada', false, true, NULL),
  ('Criador Experiente', 'experienced', 'Concluiu 2 ou mais projetos com sucesso', '2+ projetos concluídos', false, true, NULL),
  
  -- Badges de Impacto
  ('Impacto Social', 'social_impact', 'Projeto com impacto social relevante', 'Análise de impacto social', true, true, NULL),
  ('Impacto Ambiental', 'environmental_impact', 'Projeto com impacto ambiental positivo', 'Análise de impacto ambiental', true, true, NULL),
  ('Impacto Comunitário', 'community_impact', 'Projeto com forte impacto na comunidade local', 'Análise de impacto comunitário', true, true, NULL),
  ('Projeto do Mês', 'project_of_month', 'Projeto destacado do mês', 'Seleção mensal pela equipe', true, true, NULL),
  
  -- Badges de Transparência e Comunicação
  ('Prestador de Contas', 'accountable', 'Mantém prestação de contas exemplar', '100% das prestações aprovadas', false, true, NULL),
  ('Comunicação Ativa', 'active_communication', 'Mantém comunicação ativa com apoiadores', 'Atualizações regulares e respostas aos apoiadores', false, true, NULL),
  
  -- Badges Especiais
  ('Beta Founder', 'beta_founder', 'Criador pioneiro da plataforma Raiz Token', 'Cadastro nos primeiros meses da plataforma', true, true, NULL),
  ('Semente Promissora', 'promising_seed', 'Primeiro projeto com grande potencial', 'Primeiro projeto com destaque', true, true, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  is_manual = EXCLUDED.is_manual,
  updated_at = now();

-- Trigger para conceder badge "Entrega Comprovada" automaticamente
CREATE OR REPLACE FUNCTION public.grant_delivery_proven_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  -- Se prestação foi aprovada pela primeira vez
  IF NEW.accountability_approved = true AND (OLD.accountability_approved IS NULL OR OLD.accountability_approved = false) THEN
    -- Pegar ID da badge "Entrega Comprovada"
    SELECT id INTO v_badge_id 
    FROM badges 
    WHERE slug = 'delivery_proven';
    
    -- Conceder badge se ainda não tiver
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, granted_at)
      VALUES (NEW.user_id, v_badge_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER grant_delivery_proven_on_accountability
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (NEW.accountability_approved = true)
  EXECUTE FUNCTION grant_delivery_proven_badge();

-- Trigger para conceder badge "Criador Experiente" automaticamente
CREATE OR REPLACE FUNCTION public.grant_experienced_creator_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_projects INTEGER;
  v_badge_id UUID;
BEGIN
  -- Contar projetos concluídos do usuário
  SELECT COUNT(*) INTO v_completed_projects
  FROM projects
  WHERE user_id = NEW.user_id 
    AND status = 'approved'
    AND raised_amount >= goal;
  
  -- Se chegou a 2+ projetos concluídos
  IF v_completed_projects >= 2 THEN
    -- Pegar ID da badge "Criador Experiente"
    SELECT id INTO v_badge_id 
    FROM badges 
    WHERE slug = 'experienced';
    
    -- Conceder badge se ainda não tiver
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, granted_at)
      VALUES (NEW.user_id, v_badge_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER grant_experienced_creator_on_project_success
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND NEW.raised_amount >= NEW.goal)
  EXECUTE FUNCTION grant_experienced_creator_badge();

-- Trigger para conceder badge "Prestador de Contas" automaticamente
CREATE OR REPLACE FUNCTION public.grant_accountable_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_accountabilities INTEGER;
  v_approved_accountabilities INTEGER;
  v_badge_id UUID;
BEGIN
  -- Contar prestações de contas do usuário
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE accountability_approved = true)
  INTO v_total_accountabilities, v_approved_accountabilities
  FROM projects
  WHERE user_id = NEW.user_id 
    AND accountability_report IS NOT NULL;
  
  -- Se 100% das prestações foram aprovadas (e tem pelo menos 2)
  IF v_total_accountabilities >= 2 AND v_approved_accountabilities = v_total_accountabilities THEN
    -- Pegar ID da badge "Prestador de Contas"
    SELECT id INTO v_badge_id 
    FROM badges 
    WHERE slug = 'accountable';
    
    -- Conceder badge se ainda não tiver
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, granted_at)
      VALUES (NEW.user_id, v_badge_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER grant_accountable_on_accountability_approval
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (NEW.accountability_approved = true)
  EXECUTE FUNCTION grant_accountable_badge();