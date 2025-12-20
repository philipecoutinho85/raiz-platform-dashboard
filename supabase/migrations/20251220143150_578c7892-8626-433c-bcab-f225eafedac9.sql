-- Criar sequência para IDs curtos de campanhas
CREATE SEQUENCE IF NOT EXISTS project_short_id_seq START WITH 1000;

-- Adicionar coluna short_id aos projetos
ALTER TABLE public.projects 
ADD COLUMN short_id INTEGER UNIQUE DEFAULT nextval('project_short_id_seq');

-- Criar índice para busca rápida por short_id
CREATE INDEX idx_projects_short_id ON public.projects(short_id);

-- Atualizar projetos existentes que não têm short_id
UPDATE public.projects 
SET short_id = nextval('project_short_id_seq') 
WHERE short_id IS NULL;