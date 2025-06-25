
-- Adicionar campos de endereço na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT;

-- Criar tabela para galeria de imagens dos projetos (se não existir)
CREATE TABLE IF NOT EXISTS public.project_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de galeria
ALTER TABLE public.project_gallery ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view gallery images of approved projects" ON public.project_gallery;
DROP POLICY IF EXISTS "Users can manage their own project gallery" ON public.project_gallery;

-- Criar políticas RLS para a galeria
CREATE POLICY "Users can view gallery images of approved projects" 
  ON public.project_gallery 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_gallery.project_id 
      AND projects.status = 'approved'
    )
  );

CREATE POLICY "Users can manage their own project gallery" 
  ON public.project_gallery 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_gallery.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Criar bucket para galeria se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-gallery', 'project-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas de storage existentes se existirem
DROP POLICY IF EXISTS "Allow public access to project gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to project gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own project gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own project gallery files" ON storage.objects;

-- Criar políticas de storage para galeria
CREATE POLICY "Allow public access to project gallery" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'project-gallery');

CREATE POLICY "Allow authenticated users to upload to project gallery" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'project-gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own project gallery files" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'project-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own project gallery files" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'project-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
