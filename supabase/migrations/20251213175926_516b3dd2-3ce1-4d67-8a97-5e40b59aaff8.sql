-- Add project_type field to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'regular';

-- Add check constraint for project_type values
ALTER TABLE public.projects 
ADD CONSTRAINT check_project_type CHECK (project_type IN ('seed', 'regular'));

-- Comment on the new column
COMMENT ON COLUMN public.projects.project_type IS 'Type of project: seed (0% fee) or regular (10% fee)';