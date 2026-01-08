-- Criar bucket para armazenar backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 524288000, ARRAY['application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso - apenas master admins
CREATE POLICY "Only master admins can access backups"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_type = 'master'
  )
)
WITH CHECK (
  bucket_id = 'backups' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_type = 'master'
  )
);