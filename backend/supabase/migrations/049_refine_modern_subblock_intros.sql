-- Modern subblock titles share the magenta hierarchy color. The companion
-- vertical vibration wave is rendered by the document component for preview
-- and PDF, so only the theme value is persisted here.
UPDATE public.global_templates
SET
  config = config || '{
    "stylePreset": "modern",
    "h2Color": "#C0397B",
    "h3Color": "#C0397B"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
