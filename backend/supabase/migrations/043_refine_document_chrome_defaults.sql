-- Cabeçalho e rodapé são zonas editoriais fixas em todos os estilos globais.
-- Os valores continuam sendo copiados para o template pessoal e editáveis pelo
-- consultor; aqui definimos somente a configuração inicial do Vibraweb.
UPDATE public.global_templates
SET
  config = config || '{
    "showHeader": true,
    "headerRightText": "vibraweb.com.br",
    "showFooter": true,
    "footerColumns": 2,
    "footerLeft": "contato@vibraweb.com.br",
    "footerCenter": "",
    "footerRight": "vibraweb.com.br"
  }'::jsonb,
  updated_at = now()
WHERE is_system
  AND template_type = 'report';
