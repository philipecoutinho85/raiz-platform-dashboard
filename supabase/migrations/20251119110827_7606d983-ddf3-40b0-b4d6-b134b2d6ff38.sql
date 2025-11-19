-- Adicionar campos para Meta Pixel e Google Tag nos projetos
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS google_tag_id TEXT;

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.projects.meta_pixel_id IS 'ID do Meta Pixel (Facebook/Instagram) para tracking de conversão';
COMMENT ON COLUMN public.projects.google_tag_id IS 'ID da Google Tag (GTM ou GA4) para analytics e conversão';