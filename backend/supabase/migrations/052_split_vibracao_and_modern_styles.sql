-- The former Modern visual is now the branded Vibração preset. Preserve every
-- existing template before reserving `modern` for the new solid-card design.
UPDATE public.global_templates
SET
  name = CASE WHEN slug = 'vibraweb-default' THEN 'Vibração' ELSE name END,
  description = CASE WHEN slug = 'vibraweb-default' THEN 'O estilo padrão da Vibraweb, com ondas e degradês de marca.' ELSE description END,
  config = jsonb_set(config, '{stylePreset}', '"vibracao"'::jsonb, true),
  updated_at = now()
WHERE config->>'stylePreset' = 'modern';

-- Personal templates may use either the legacy flat config or the newer
-- templates array. Migrate both shapes without changing user customizations.
UPDATE public.user_profiles
SET
  brand_config = CASE
    WHEN jsonb_typeof(brand_config->'templates') = 'array' THEN
      jsonb_set(
        CASE
          WHEN brand_config->>'stylePreset' = 'modern' THEN jsonb_set(brand_config, '{stylePreset}', '"vibracao"'::jsonb, true)
          ELSE brand_config
        END,
        '{templates}',
        (
          SELECT COALESCE(jsonb_agg(
            CASE
              WHEN template->'config'->>'stylePreset' = 'modern'
                THEN jsonb_set(template, '{config,stylePreset}', '"vibracao"'::jsonb, true)
              ELSE template
            END ORDER BY position
          ), '[]'::jsonb)
          FROM jsonb_array_elements(brand_config->'templates') WITH ORDINALITY AS entries(template, position)
        ),
        true
      )
    WHEN brand_config->>'stylePreset' = 'modern'
      THEN jsonb_set(brand_config, '{stylePreset}', '"vibracao"'::jsonb, true)
    ELSE brand_config
  END,
  updated_at = now()
WHERE brand_config->>'stylePreset' = 'modern'
   OR (jsonb_typeof(brand_config->'templates') = 'array' AND EXISTS (
     SELECT 1
     FROM jsonb_array_elements(brand_config->'templates') AS template
     WHERE template->'config'->>'stylePreset' = 'modern'
   ));

INSERT INTO public.global_templates (
  slug, name, description, template_type, config, is_active, is_system, sort_order
)
VALUES (
  'modern',
  'Modern',
  'Cards sólidos, cantos arredondados e linhas diretas.',
  'report',
  '{
    "stylePreset": "modern",
    "ornamentDividerKey": "none",
    "ornamentColor": "#2457C5",
    "primaryColor": "#581C3C",
    "secondaryColor": "#C0397B",
    "accentColor": "#FDB813",
    "titleFont": "Poppins",
    "bodyFont": "Inter",
    "h1Font": "Poppins",
    "h2Font": "Poppins",
    "h3Font": "Poppins",
    "h4Font": "Poppins",
    "h1Color": "#581C3C",
    "h1TextAlign": "left",
    "h2Color": "#581C3C",
    "h3Color": "#C0397B",
    "h4Color": "#4C2A68",
    "bodyColor": "#352632",
    "plainTextMode": false,
    "quoteStyle": "accented"
  }'::jsonb,
  false,
  true,
  1
)
ON CONFLICT (slug) DO NOTHING;
