-- No Holístico, o ouro profundo dá hierarquia aos títulos principais sem
-- competir com o roxo usado nas molduras, divisores e subtítulos.
UPDATE public.global_templates
SET
  config = config || '{
    "h1Color": "#8A5A00"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'holistic'
  AND is_system;
