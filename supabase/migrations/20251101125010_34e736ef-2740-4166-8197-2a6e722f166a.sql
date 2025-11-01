-- Inserir configuração inicial para links de redes sociais
INSERT INTO public.system_settings (key, value)
VALUES (
  'social_links',
  '{"linkedin": "", "instagram": "", "twitter": ""}'::jsonb
)
ON CONFLICT (key) DO NOTHING;