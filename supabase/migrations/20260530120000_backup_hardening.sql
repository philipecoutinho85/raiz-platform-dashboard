-- Backup hardening: add operational metadata without breaking existing records
ALTER TABLE public.backup_files
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sha256_checksum TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_backup_files_status_created_at
  ON public.backup_files(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_files_checksum
  ON public.backup_files(sha256_checksum)
  WHERE sha256_checksum IS NOT NULL;

-- Keep the private backup bucket compatible with application/zip uploads and larger emergency exports.
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 2147483648,
  allowed_mime_types = ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
WHERE id = 'backups';

-- If the bucket does not exist in a fresh environment, create it safely.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  false,
  2147483648,
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;
