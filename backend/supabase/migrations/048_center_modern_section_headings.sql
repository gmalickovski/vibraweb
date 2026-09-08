-- Main Modern sections use a centered, high-contrast gold title and the
-- Vibraweb vibration wave as a single visual signature.
UPDATE public.global_templates
SET
  config = config || '{
    "stylePreset": "modern",
    "h1Font": "Poppins",
    "h1Color": "#9A5A00",
    "h1TextAlign": "center",
    "h2Color": "#581C3C",
    "h3Color": "#C0397B",
    "h4Color": "#581C3C"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
