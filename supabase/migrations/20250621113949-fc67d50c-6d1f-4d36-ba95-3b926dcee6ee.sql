
-- Criar tabela para imagens dos projetos
CREATE TABLE public.project_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para project_images
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Políticas para project_images
CREATE POLICY "Anyone can view project images" 
    ON public.project_images 
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Project owners can manage their project images" 
    ON public.project_images 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_images.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Criar tabela para contribuições dos projetos
CREATE TABLE public.project_contributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Habilitar RLS para project_contributions
ALTER TABLE public.project_contributions ENABLE ROW LEVEL SECURITY;

-- Políticas para project_contributions
CREATE POLICY "Anyone can view project contributions" 
    ON public.project_contributions 
    FOR SELECT 
    TO public
    USING (true);

CREATE POLICY "Users can create their own contributions" 
    ON public.project_contributions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contributions" 
    ON public.project_contributions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Adicionar colunas para valores arrecadados e número de apoiadores nos projetos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS raised_amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS backers_count INTEGER NOT NULL DEFAULT 0;

-- Função para atualizar estatísticas do projeto quando há uma nova contribuição
CREATE OR REPLACE FUNCTION public.update_project_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Atualizar valores arrecadados e número de apoiadores
    UPDATE public.projects
    SET 
        raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.project_contributions
            WHERE project_id = NEW.project_id AND status = 'completed'
        ),
        backers_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM public.project_contributions
            WHERE project_id = NEW.project_id AND status = 'completed'
        )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$;

-- Trigger para atualizar estatísticas automaticamente
CREATE TRIGGER update_project_stats_trigger
    AFTER INSERT OR UPDATE ON public.project_contributions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_stats();

-- Criar bucket para imagens dos projetos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens
CREATE POLICY "Anyone can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Anyone can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Project owners can delete their images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);
