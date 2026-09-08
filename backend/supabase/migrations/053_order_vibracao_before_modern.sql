-- Vibração is the default and entry-level preset; Modern follows it in the
-- style catalog before the editorial alternatives.
UPDATE public.global_templates
SET sort_order = CASE
  WHEN slug = 'vibraweb-default' THEN 10
  WHEN slug = 'modern' THEN 15
  ELSE sort_order
END,
updated_at = now()
WHERE slug IN ('vibraweb-default', 'modern');
