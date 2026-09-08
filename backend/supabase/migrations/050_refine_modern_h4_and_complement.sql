-- The Modern preset has an independent H4 hierarchy color and a fourth
-- complementary accent used by its document ornaments and instructional UI.
UPDATE public.global_templates
SET
  config = config || '{
    "stylePreset": "modern",
    "h4Color": "#4C2A68",
    "ornamentColor": "#2457C5"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
