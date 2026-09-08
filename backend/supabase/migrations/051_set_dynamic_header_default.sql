-- The default document header is generated from the analysis context. An
-- explicit value remains a per-template override, but the system preset must
-- not replace the contextual title with a fixed website address.
UPDATE public.global_templates
SET
  config = config || '{ "headerRightText": "" }'::jsonb,
  updated_at = now()
WHERE slug = 'vibraweb-default';
