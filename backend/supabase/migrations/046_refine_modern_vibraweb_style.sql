-- Modern is the primary Vibraweb visual language: deep wine for structure,
-- magenta for signaling, and gold for emphasis on the light document surface.
UPDATE public.global_templates
SET
  description = 'Estilo principal Vibraweb: vinho estrutural, magenta de sinalização, dourado de destaque e cards numéricos de alto contraste.',
  config = config || '{
    "stylePreset": "modern",
    "ornamentDividerKey": "none",
    "ornamentColor": "#C0397B",
    "primaryColor": "#581C3C",
    "secondaryColor": "#C0397B",
    "accentColor": "#FDB813",
    "titleFont": "Poppins",
    "bodyFont": "Inter",
    "titleColor": "#581C3C",
    "logoTextColor": "#C0397B",
    "clientColor": "#C0397B",
    "headerColor": "#C0397B",
    "h1Font": "Poppins",
    "h2Font": "Poppins",
    "h3Font": "Poppins",
    "h4Font": "Poppins",
    "h1Color": "#581C3C",
    "h2Color": "#581C3C",
    "h3Color": "#C0397B",
    "h4Color": "#581C3C",
    "bodyColor": "#352632",
    "plainTextMode": false,
    "quoteStyle": "accented"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
