-- Corrigir ambiguidade na coluna "status" na função recalculate_user_raizscore
CREATE OR REPLACE FUNCTION public.recalculate_user_raizscore(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND projects.status = 'approved'
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
  WHERE user_id = p_user_id AND projects.status = 'approved';

  -- 2.4 Denúncias (negativas)
  SELECT COALESCE(
    SUM(CASE 
      WHEN pr.status = 'resolved' AND admin_response LIKE '%infundada%' THEN 3
      WHEN pr.status = 'resolved' THEN -7
      WHEN pr.status = 'pending' THEN -3
      ELSE 0
    END), 0
  ) INTO v_reports_points
  FROM project_reports pr
  JOIN projects p ON pr.project_id = p.id
  WHERE p.user_id = p_user_id;

  -- 2.5 Engajamento (apoiadores únicos)
  SELECT COALESCE(COUNT(DISTINCT pc.user_id), 0) INTO v_engagement_points
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
    AND projects.status = 'approved'
    AND raised_amount >= goal;

  -- 2.7 Tempo de Plataforma
  SELECT created_at INTO v_profile_created_at
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile_created_at IS NOT NULL THEN
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
$function$;