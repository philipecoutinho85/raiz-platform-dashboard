-- Allow authenticated users to view profiles of project creators and comment authors
CREATE POLICY "Anyone can view project creator profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.user_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_comments
    WHERE project_comments.user_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_contributions
    WHERE project_contributions.user_id = profiles.id
  )
);