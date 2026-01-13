/**
 * Script para criar schema e tabela no Supabase + migrar dados do Notion
 * Executa tudo de uma vez: cria tabela e importa dados
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const { Client: PgClient } = require('pg');

// Configurações Supabase PostgreSQL (via variáveis de ambiente)
const pgHost = process.env.POSTGRES_HOST || 'localhost';
const SUPABASE_DB_CONFIG = {
    host: pgHost,
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Configurações Notion
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '1d146a684e958071aaf0daaf18295179';

const notion = new Client({ auth: NOTION_API_KEY });

/**
 * Executa SQL no Supabase
 */
async function executeSql(pgClient, sql) {
    try {
        await pgClient.query(sql);
        console.log('✓ SQL executado com sucesso');
        return true;
    } catch (error) {
        console.error('✗ Erro SQL:', error.message);
        return false;
    }
}

/**
 * Cria o schema e tabela
 */
async function createSchemaAndTable(pgClient) {
    console.log('\n📦 Criando schema e tabela...');

    const sql = `
        -- Criar schema
        CREATE SCHEMA IF NOT EXISTS vibraweb;
        
        -- Dar permissões
        GRANT USAGE ON SCHEMA vibraweb TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA vibraweb TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA vibraweb TO anon, authenticated, service_role;
        
        -- Criar tabela
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
        
        -- Índices
        CREATE INDEX IF NOT EXISTS idx_vibraweb_titulo ON vibraweb.textos_analise_proposito(titulo);
        CREATE INDEX IF NOT EXISTS idx_vibraweb_numero ON vibraweb.textos_analise_proposito(numero);
    `;

    await executeSql(pgClient, sql);
    console.log('✓ Schema vibraweb e tabela criados!');
}

/**
 * Extrai texto de blocos do Notion
 */
function extractTextFromBlocks(blocks) {
    let text = '';
    for (const block of blocks) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
            text += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n\n';
        } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
            text += '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n\n';
        } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
            text += '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n\n';
        } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
            text += '### ' + block.heading_3.rich_text.map(t => t.plain_text).join('') + '\n\n';
        } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
            text += '• ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        }
    }
    return text.trim();
}

/**
 * Busca conteúdo de uma página
 */
async function getPageContent(pageId) {
    try {
        const response = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
        return extractTextFromBlocks(response.results);
    } catch (error) {
        return '';
    }
}

/**
 * Busca todas as páginas do Notion
 */
async function fetchAllNotionPages() {
    const pages = [];
    let hasMore = true;
    let startCursor = undefined;

    console.log('\n📚 Buscando páginas do Notion...');

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            start_cursor: startCursor,
            page_size: 100
        });

        for (const page of response.results) {
            const titulo = page.properties['Títulos']?.select?.name || '';
            const numero = page.properties['Números']?.select?.name || '';
            const textoTitulo = page.properties['Textos']?.title?.[0]?.plain_text || '';
            const conteudo = await getPageContent(page.id);

            pages.push({ notion_page_id: page.id, titulo, numero, texto_titulo: textoTitulo, conteudo });
            process.stdout.write(`\r  Processando: ${pages.length} páginas...`);
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    console.log(`\n✓ Total: ${pages.length} páginas encontradas`);
    return pages;
}

/**
 * Insere dados no Supabase
 */
async function insertIntoSupabase(pgClient, pages) {
    console.log('\n📤 Inserindo dados no Supabase...');

    let inserted = 0;
    for (const page of pages) {
        try {
            await pgClient.query(`
                INSERT INTO vibraweb.textos_analise_proposito 
                (notion_page_id, titulo, numero, texto_titulo, conteudo)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (notion_page_id) DO UPDATE SET
                    titulo = EXCLUDED.titulo,
                    numero = EXCLUDED.numero,
                    texto_titulo = EXCLUDED.texto_titulo,
                    conteudo = EXCLUDED.conteudo,
                    updated_at = NOW()
            `, [page.notion_page_id, page.titulo, page.numero, page.texto_titulo, page.conteudo]);
            inserted++;
            process.stdout.write(`\r  Inserido: ${inserted}/${pages.length}`);
        } catch (error) {
            console.error(`\n✗ Erro ao inserir ${page.titulo}:`, error.message);
        }
    }

    console.log(`\n✓ ${inserted} registros inseridos/atualizados!`);
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando migração Notion → Supabase');
    console.log('========================================');

    if (!NOTION_API_KEY) {
        console.error('❌ NOTION_API_KEY não configurada no .env!');
        process.exit(1);
    }

    // Conectar ao PostgreSQL
    console.log('\n🔌 Conectando ao Supabase PostgreSQL...');
    const pgClient = new PgClient(SUPABASE_DB_CONFIG);

    try {
        await pgClient.connect();
        console.log('✓ Conectado!');

        // Criar schema e tabela
        await createSchemaAndTable(pgClient);

        // Buscar dados do Notion
        const pages = await fetchAllNotionPages();

        if (pages.length === 0) {
            console.log('⚠️ Nenhuma página encontrada.');
            return;
        }

        // Inserir no Supabase
        await insertIntoSupabase(pgClient, pages);

        console.log('\n🎉 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pgClient.end();
    }
}

main();
