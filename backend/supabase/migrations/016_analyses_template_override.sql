-- 016_analyses_template_override.sql
-- Item: fluxo de criação, Fase 2 (Guilherme, 2026-07-12 — ver
-- Produto/docs/vibra-web/requisitos.md).
--
-- Estende o mesmo padrão de override por cliente já usado por
-- text_overrides/block_order (migration 014) para o TEMPLATE de marca:
-- permite fixar um template específico (Padrão Vibraweb ou um dos templates
-- customizados do consultor) só para esta análise, sem alterar o template
-- ativo global do consultor (user_profiles.brand_config.activeTemplateId,
-- editado em /app/marca).
--
-- Nullable: null = segue dinamicamente o template ativo global do consultor
-- (comportamento de hoje). Um id específico ('default' ou o id de um
-- template salvo em brand_config.templates) = fixa esse template só para
-- este cliente, mesmo que o padrão global mude depois.

alter table public.analyses
  add column if not exists template_id text default null;

comment on column public.analyses.template_id is
  'Override de template de marca específico deste cliente/análise. Valores possíveis: null (segue o template ativo global do consultor), ''default'' (fixa "Padrão Vibraweb" independente do global) ou o id de um template em user_profiles.brand_config.templates. Ver frontend/src/pages/PreviewPage.tsx.';
