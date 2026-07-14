-- 014_analyses_per_client_overrides.sql
-- Item: fluxo de criação, Fase 2 (Guilherme, 2026-07-11 — ver
-- Produto/docs/vibra-web/requisitos.md).
--
-- Permite que um consultor ajuste texto de interpretação e ordem/visibilidade
-- de blocos ESPECIFICAMENTE para um cliente, sem alterar o padrão global do
-- consultor (user_profiles.block_order / user_interpretations).
--
-- Ambas as colunas são nullable: null = usa o padrão global do consultor
-- (fallback), exatamente como já acontece hoje com user_profiles.block_order.
--
-- text_overrides shape: { [numero]: { [tipo]: texto } }
-- block_order shape: igual ao já usado em user_profiles.block_order — ver
-- frontend/src/lib/block-order.ts (BlockOrderConfig).

alter table public.analyses
  add column if not exists text_overrides jsonb default null,
  add column if not exists block_order jsonb default null;

comment on column public.analyses.text_overrides is
  'Override de texto de interpretação específico deste cliente. Shape: { [numero]: { [tipo]: texto } }. Null = usa o padrão do consultor (user_interpretations) e depois o padrão global (interpretacoes).';

comment on column public.analyses.block_order is
  'Ordem/visibilidade de blocos do relatório específica deste cliente. Mesmo shape de user_profiles.block_order (ver lib/block-order.ts). Null = usa o padrão do consultor.';
