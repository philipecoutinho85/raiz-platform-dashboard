
-- Adicionar campos para administração de projetos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Atualizar o constraint de status para incluir todos os estados possíveis
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'draft'));

-- Adicionar campo para avatar na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar tabela para busca de projetos (índices para performance)
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_title ON public.projects USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_projects_description ON public.projects USING gin(to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Políticas RLS para projetos (permitir que todos vejam projetos aprovados)
DROP POLICY IF EXISTS "Anyone can view approved projects" ON public.projects;
CREATE POLICY "Anyone can view approved projects" 
    ON public.projects 
    FOR SELECT 
    USING (status = 'approved' OR user_id = auth.uid());

-- Política para administradores gerenciarem projetos
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" 
    ON public.projects 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para usuários criarem seus próprios projetos
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects" 
    ON public.projects 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários visualizarem seus próprios projetos
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" 
    ON public.projects 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Habilitar RLS na tabela projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Criar bucket para avatars se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para avatars
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
