-- Criar tabela para armazenar backups gerados
CREATE TABLE IF NOT EXISTS public.backup_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  tables_count INTEGER NOT NULL DEFAULT 0,
  records_count INTEGER NOT NULL DEFAULT 0,
  storage_files_count INTEGER DEFAULT 0,
  storage_size_bytes BIGINT DEFAULT 0,
  include_storage BOOLEAN DEFAULT true,
  manifest JSONB,
  errors JSONB,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  downloaded_count INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_backup_files_created_by ON public.backup_files(created_by);
CREATE INDEX idx_backup_files_created_at ON public.backup_files(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.backup_files ENABLE ROW LEVEL SECURITY;

-- Apenas master admins podem ver/gerenciar backups
CREATE POLICY "Only master admins can manage backups"
ON public.backup_files
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_type = 'master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_type = 'master'
  )
);