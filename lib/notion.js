import { Client } from '@notionhq/client';

const notion = new Client({ 
  auth: process.env.NOTION_API_KEY 
});

// Cache para armazenar resultados
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutos

/**
 * Consulta o Notion para buscar os blocos (conteúdo) de uma página (linha) do banco de dados,
 * filtrando-as pela propriedade *Títulos* e *Números* (utilizando o tipo "select",
 * conforme a sua configuração).
 *
 * @param {string} campo - Nome do campo (Ex: "Expressão")
 * @param {number} valor - Valor associado (Ex: 6) (convertido para string para o filtro)
 * @returns {Promise<Array>} - Um array de blocos ou um array vazio se não encontrado.
 */
export async function buscarBlocosPorCampo(campo, valor) {
  const cacheKey = `${campo}-${valor}`;

  // Verifica se o resultado está no cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          { property: "Títulos", select: { equals: campo } },
          { property: "Números", select: { equals: String(valor) } },
        ],
      },
    });

    if (response.results.length > 0) {
      const blocks = await notion.blocks.children.list({
        block_id: response.results[0].id,
        page_size: 100,
      });

      // Salva no cache
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: blocks.results,
      });

      return blocks.results;
    }

    return [];
  } catch (error) {
    console.error('Erro ao consultar Notion:', error);
    return [];
  }
}