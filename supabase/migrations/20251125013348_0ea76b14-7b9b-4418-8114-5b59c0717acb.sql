
-- Corrigir a policy "Anyone can view approved projects" para qualificar a coluna status
DROP POLICY IF EXISTS "Anyone can view approved projects" ON public.projects;

CREATE POLICY "Anyone can view approved projects"
ON public.projects
FOR SELECT
USING ((projects.status = 'approved'::text) OR (projects.user_id = auth.uid()));
