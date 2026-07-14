-- Migration 013: Blocos do Relatório — ordem/visibilidade configurável por consultor
-- Ver Produto/docs/vibra-web/requisitos.md, seção 1.
-- NULL = perfil ainda não configurou nada; document-builder.ts usa DEFAULT_BLOCK_ORDER
-- (frontend/src/lib/block-order.ts) como fallback, preservando o comportamento atual.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS block_order JSONB DEFAULT NULL;

COMMENT ON COLUMN user_profiles.block_order IS
  'Ordem e visibilidade dos blocos do relatório PDF. Formato: { order: string[], hidden: string[], children: { caminho_desafios: { order: string[], hidden: string[] } } }. NULL = ordem padrão do sistema.';
