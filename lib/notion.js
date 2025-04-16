// lib/notion.js (adicionado ou ajustado)
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
  try {
    // Mapeamento exato dos campos do Notion
    const camposNotion = {
      "Momento Decisivo": { titulo: "Momento Decisivo", tipo: "select" },
      "Resposta do Subconsciênte": { titulo: "Resposta do Subconsciênte", tipo: "select" },
      // ...existing mappings...
    };

    const campoNotion = camposNotion[campo] || { titulo: campo, tipo: "select" };
    
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: "Títulos",
            select: { equals: campoNotion.titulo }
          },
          {
            property: "Números",
            select: { equals: String(valor) }
          }
        ]
      }
    });

    if (response.results.length > 0) {
      const page = response.results[0];
      const blocksResponse = await notion.blocks.children.list({
        block_id: page.id,
        page_size: 100
      });

      return blocksResponse.results;
    }
    
    console.log(`Nenhum resultado encontrado para ${campo} com valor ${valor}`);
    return [];
  } catch (error) {
    console.error('Erro ao consultar Notion:', error, { campo, valor });
    return [];
  }
}