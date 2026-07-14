-- Migration 012: Seed Definição de Dia Natalício
-- Corrige bug encontrado em 2026-07-11 (ver Produto/docs/vibra-web/requisitos.md, seção 3a):
-- document-builder.ts referencia a chave 'estatico_def_dia_natalicio' (via numEntry() em
-- 'O Caminho e os Desafios') mas nenhuma seed até agora criava essa linha — a seção
-- "Dia Natalício" nunca mostrava o texto introdutório no relatório final.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_dia_natalicio', 'Definição de Dia Natalício', 'O Dia Natalício corresponde ao número do dia do mês em que você nasceu, reduzido à sua vibração numerológica quando necessário. Ele representa um dom natural, uma habilidade inata que já vem com você desde o nascimento e que costuma se manifestar com facilidade, quase sem esforço consciente. Diferente de outros números do mapa que exigem desenvolvimento ao longo da vida, o Dia Natalício já é uma vibração ativa desde cedo — funciona como uma ferramenta extra à disposição, reforçando ou complementando as características do seu número de Destino e do seu Número Psíquico. Conhecer essa vibração ajuda a identificar talentos que muitas vezes passam despercebidos por parecerem "naturais demais" para serem reconhecidos como um diferencial.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto;
