-- Public marketplace visibility fix.
-- Allows anonymous and authenticated non-admin users to read only approved projects
-- and the public metadata needed to render marketplace/home cards.
-- Draft, pending, rejected, cancelled and archived projects remain hidden from the public.

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved projects" ON public.projects;
CREATE POLICY "Public can view approved projects"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "Public can view images for approved projects" ON public.project_images;
CREATE POLICY "Public can view images for approved projects"
ON public.project_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_images.project_id
      AND p.status = 'approved'
  )
);

COMMENT ON POLICY "Public can view approved projects" ON public.projects IS
'Allows marketplace/home/project detail public reads only for projects approved by admin.';

COMMENT ON POLICY "Public can view images for approved projects" ON public.project_images IS
'Allows public rendering of images only for projects already approved and visible in marketplace/home.';
