/**
 * Script de Migração: Notion → Supabase
 * 
 * Este script copia todos os dados da tabela "Textos Análise de Propósito"
 * do Notion para o Supabase no schema 'vibraweb'.
 * 
 * Uso: node scripts/migrate-notion-to-supabase.js
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

// Configurações
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = '1d146a68-4e95-8071-aaf0-daaf18295179';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.studiomlk.com.br';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Clientes
const notion = new Client({ auth: NOTION_API_KEY });

/**
 * Faz requisições para o Supabase REST API
 */
async function supabaseQuery(endpoint, method = 'GET', body = null) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase error: ${response.status} - ${errorText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
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
        } else if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
            text += '1. ' + block.numbered_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        }
    }

    return text.trim();
}

/**
 * Busca o conteúdo (blocks) de uma página do Notion
 */
async function getPageContent(pageId) {
    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100
        });
        return extractTextFromBlocks(response.results);
    } catch (error) {
        console.error(`Erro ao buscar conteúdo da página ${pageId}:`, error.message);
        return '';
    }
}

/**
 * Busca todas as páginas do banco de dados do Notion
 */
async function fetchAllNotionPages() {
    const pages = [];
    let hasMore = true;
    let startCursor = undefined;

    console.log('📚 Buscando páginas do Notion...');

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

            pages.push({
                notion_page_id: page.id,
                titulo,
                numero,
                texto_titulo: textoTitulo,
                conteudo
            });

            console.log(`  ✓ ${titulo} - ${numero}: ${textoTitulo}`);
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    console.log(`\n📊 Total de páginas encontradas: ${pages.length}`);
    return pages;
}

/**
 * Insere dados no Supabase
 */
async function insertIntoSupabase(pages) {
    console.log('\n📤 Inserindo dados no Supabase...');

    const batchSize = 50;
    for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);

        try {
            await supabaseQuery('textos_analise_proposito', 'POST', batch);
            console.log(`  ✓ Inserido lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)}`);
        } catch (error) {
            console.error(`  ✗ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
    }

    console.log('\n✅ Migração concluída!');
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando migração Notion → Supabase');
    console.log('========================================\n');

    if (!NOTION_API_KEY) {
        console.error('❌ NOTION_API_KEY não configurada!');
        process.exit(1);
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
        process.exit(1);
    }

    const pages = await fetchAllNotionPages();

    if (pages.length === 0) {
        console.log('⚠️  Nenhuma página encontrada no Notion.');
        return;
    }

    await insertIntoSupabase(pages);

    console.log('\n🎉 Migração finalizada com sucesso!');
    console.log(`   Total de registros migrados: ${pages.length}`);
}

main().catch(console.error);
