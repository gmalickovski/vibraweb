-- ============================================
-- SQL de Criação do Schema VIBRAWEB
-- Supabase Self-Hosted
-- ============================================

-- 1. Criar schema vibraweb
CREATE SCHEMA IF NOT EXISTS vibraweb;

-- 2. Dar permissões ao schema
GRANT USAGE ON SCHEMA vibraweb TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA vibraweb TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vibraweb TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA vibraweb GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA vibraweb GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 3. Criar tabela principal de textos
CREATE TABLE IF NOT EXISTS vibraweb.textos_analise_proposito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notion_page_id TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    numero TEXT,
    texto_titulo TEXT,
    conteudo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_vibraweb_textos_titulo 
    ON vibraweb.textos_analise_proposito(titulo);
CREATE INDEX IF NOT EXISTS idx_vibraweb_textos_numero 
    ON vibraweb.textos_analise_proposito(numero);
CREATE INDEX IF NOT EXISTS idx_vibraweb_textos_titulo_numero 
    ON vibraweb.textos_analise_proposito(titulo, numero);

-- 5. Habilitar RLS
ALTER TABLE vibraweb.textos_analise_proposito ENABLE ROW LEVEL SECURITY;

-- 6. Criar policies
CREATE POLICY "vibraweb_select_all" 
    ON vibraweb.textos_analise_proposito FOR SELECT USING (true);
CREATE POLICY "vibraweb_insert_service_role" 
    ON vibraweb.textos_analise_proposito FOR INSERT WITH CHECK (true);
CREATE POLICY "vibraweb_update_service_role" 
    ON vibraweb.textos_analise_proposito FOR UPDATE USING (true);
CREATE POLICY "vibraweb_delete_service_role" 
    ON vibraweb.textos_analise_proposito FOR DELETE USING (true);

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION vibraweb.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_textos_updated_at
    BEFORE UPDATE ON vibraweb.textos_analise_proposito
    FOR EACH ROW
    EXECUTE FUNCTION vibraweb.update_updated_at_column();

-- IMPORTANTE: Adicionar vibraweb ao PGRST_DB_SCHEMAS no .env do Supabase:
-- PGRST_DB_SCHEMAS=public,storage,graphql_public,sincroapp,vibraweb
