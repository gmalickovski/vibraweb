-- Estilos visuais oficiais do Vibraweb.
-- A tabela global_templates já é o catálogo versionável de templates; não
-- criamos uma tabela paralela para evitar duplicar a cadeia de ativação/RLS.

DROP POLICY IF EXISTS "Authenticated users read active templates" ON public.global_templates;
CREATE POLICY "Authenticated users read system style templates"
  ON public.global_templates FOR SELECT TO authenticated
  USING (is_system OR is_active OR (SELECT private.is_admin()));

UPDATE public.global_templates
SET
  name = 'Modern',
  description = 'Estilo moderno original do Vibraweb, com cards, contraste e ritmo visual.',
  config = config || '{
    "stylePreset": "modern",
    "ornamentDividerKey": "none",
    "ornamentColor": "#4C2A68",
    "plainTextMode": false
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';

INSERT INTO public.global_templates
  (slug, name, description, template_type, config, is_active, is_system, sort_order)
VALUES
  (
    'holistic',
    'Holístico',
    'Roxo profundo, títulos clássicos e ornamentos decorativos inspirados em divisores editoriais.',
    'report',
    '{
      "stylePreset": "holistic",
      "ornamentDividerKey": "flourish",
      "ornamentColor": "#4C2A68",
      "primaryColor": "#4C2A68",
      "secondaryColor": "#2A173D",
      "accentColor": "#72538A",
      "titleFont": "Cinzel",
      "bodyFont": "Lora",
      "h1Font": "Cinzel",
      "h2Font": "Cormorant Garamond",
      "h3Font": "Cormorant Garamond",
      "h4Font": "Cormorant Garamond",
      "h1Color": "#4C2A68",
      "h2Color": "#4C2A68",
      "h3Color": "#4C2A68",
      "h4Color": "#4C2A68",
      "bodyColor": "#3F3547",
      "plainTextMode": false,
      "quoteStyle": "subtle"
    }'::jsonb,
    false,
    true,
    20
  ),
  (
    'minimalist',
    'Minimalista',
    'Hierarquia Vibraweb sóbria, cores monocromáticas e uma ornamentação editorial discreta.',
    'report',
    '{
      "stylePreset": "minimalist",
      "ornamentDividerKey": "line",
      "ornamentColor": "#5F6368",
      "primaryColor": "#34383D",
      "secondaryColor": "#555B63",
      "accentColor": "#8A9199",
      "titleFont": "Inter",
      "bodyFont": "Inter",
      "h1Font": "Inter",
      "h2Font": "Inter",
      "h3Font": "Inter",
      "h4Font": "Inter",
      "h1Color": "#34383D",
      "h2Color": "#34383D",
      "h3Color": "#4A5057",
      "h4Color": "#4A5057",
      "bodyColor": "#3F444A",
      "plainTextMode": true,
      "quoteStyle": "minimal"
    }'::jsonb,
    false,
    true,
    30
  ),
  (
    'default',
    'Default',
    'Documento de texto puro, preto no branco, com uma única fonte e sem elementos decorativos.',
    'report',
    '{
      "stylePreset": "default",
      "ornamentDividerKey": "none",
      "ornamentColor": "#111111",
      "primaryColor": "#111111",
      "secondaryColor": "#111111",
      "accentColor": "#111111",
      "titleFont": "Arial",
      "bodyFont": "Arial",
      "h1Font": "Arial",
      "h2Font": "Arial",
      "h3Font": "Arial",
      "h4Font": "Arial",
      "h1Color": "#111111",
      "h2Color": "#111111",
      "h3Color": "#111111",
      "h4Color": "#111111",
      "bodyColor": "#111111",
      "plainTextMode": true,
      "quoteStyle": "minimal",
      "showWatermark": false,
      "showVibrawebBranding": false,
      "showHeader": false,
      "showFooter": false
    }'::jsonb,
    false,
    true,
    40
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = public.global_templates.config || EXCLUDED.config,
  is_system = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
