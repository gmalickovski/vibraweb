-- O logo institucional é a identidade de fallback dos estilos globais.
-- Consultores com logo própria continuam substituindo-o no resolvedor de tema.
UPDATE public.global_templates
SET
  config = config || '{
    "logoUrl": "/assets/logo-vibraweb.svg",
    "logoMode": "image",
    "headerLogoUrl": "/assets/logo-vibraweb.svg"
  }'::jsonb,
  updated_at = now()
WHERE is_system
  AND template_type = 'report';
