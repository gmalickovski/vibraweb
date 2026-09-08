-- The Modern preset uses the full Vibraweb color language in decorative
-- elements while preserving dark text and a white paper surface for reading.
UPDATE public.global_templates
SET
  description = 'Estilo principal Vibraweb: títulos Poppins, leitura em Inter e gradientes de dourado, laranja, magenta, roxo e azul em elementos de destaque.',
  config = config || '{
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
    "h2Color": "#581C3C",
    "h3Color": "#C0397B",
    "h4Color": "#581C3C",
    "bodyColor": "#352632"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
