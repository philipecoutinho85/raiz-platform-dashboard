-- Atualizar bucket de backups para permitir mais tipos de arquivo
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
WHERE id = 'backups';

-- Se o bucket não existir, criar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 524288000, ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET 
  allowed_mime_types = ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];