-- Adiciona a coluna brand_config na tabela user_profiles para salvar a customização visual

ALTER TABLE user_profiles
ADD COLUMN brand_config JSONB DEFAULT '{}'::jsonb;

-- Opcional: comentário na coluna
COMMENT ON COLUMN user_profiles.brand_config IS 'Configurações de identidade visual do usuário (Pro), contendo opções de capa, header, footer e cores.';
