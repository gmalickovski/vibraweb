-- Consultores podem escolher qualquer estilo oficial do catálogo, mas só
-- administradores podem criar, editar, publicar ou excluir templates globais.
DROP POLICY IF EXISTS "Authenticated users read active templates" ON public.global_templates;
DROP POLICY IF EXISTS "Authenticated users read system style templates" ON public.global_templates;

CREATE POLICY "Authenticated users read system style templates"
  ON public.global_templates FOR SELECT TO authenticated
  USING (is_system OR is_active OR (SELECT private.is_admin()));
