-- Migration 027: Seed Definições (introdução) de Tendência Oculta e Momento
-- Decisivo — 2 categorias que passaram a ter defKey em document-builder.ts
-- (restructuring feito em sessão externa) mas ainda não tinham entrada nem
-- em CATEGORY_DEFS (CustomTexts.tsx) nem texto padrão no banco.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_tendencia_oculta', 'Definição de Tendência Oculta', 'As Tendências Ocultas são desejos remanescentes de vidas passadas que se manifestam como comportamentos recorrentes, geralmente na infância, adolescência e juventude. Elas são identificadas pela repetição de um mesmo número quatro vezes ou mais entre as letras do nome de nascimento — quanto mais vezes um número se repete, mais intensa é essa tendência. Diferente de um talento a ser desenvolvido, a Tendência Oculta é um impulso que já está presente e ativo; se não for reconhecida e canalizada conscientemente, tende a se manifestar de forma desequilibrada ao longo da vida.'),

(1, 'estatico_def_momento_decisivo', 'Definição de Momentos Decisivos', 'Os Momentos Decisivos são quatro períodos calculados a partir da data de nascimento que apontam fases de maior intensidade e viradas significativas ao longo da vida — janelas de tempo em que decisões tomadas tendem a ter um peso maior sobre os rumos futuros. Diferente dos Ciclos de Vida (que descrevem fases longas e contínuas), os Momentos Decisivos funcionam como marcos pontuais de amadurecimento, nos quais a pessoa é chamada a integrar novas qualidades e encerrar padrões que já não servem mais ao seu crescimento.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
