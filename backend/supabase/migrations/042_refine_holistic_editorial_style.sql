-- Refinamento do estilo Holístico: tipografia editorial legível no corpo e
-- hierarquia clássica nos títulos. Os detalhes de moldura vivem no frontend,
-- enquanto estes tokens são a base que cada novo modelo pessoal recebe.
UPDATE public.global_templates
SET
  description = 'Leitura editorial com Lora no corpo, títulos clássicos e ornamentos discretos de moldura.',
  config = config || '{
    "stylePreset": "holistic",
    "ornamentDividerKey": "flourish",
    "ornamentColor": "#4C2A68",
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
    "bodyColor": "#4A414F",
    "plainTextMode": false,
    "quoteStyle": "subtle"
  }'::jsonb,
  updated_at = now()
WHERE slug = 'holistic';
