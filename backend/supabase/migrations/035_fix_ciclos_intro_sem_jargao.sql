-- Migration 035: remove jargão interno do texto voltado ao cliente — a
-- introdução dos Ciclos começava com "Este bloco reúne..."; "bloco" é
-- vocabulário da ferramenta (Blocos do Relatório), não do documento que o
-- cliente lê. Único texto do banco que usava a palavra (verificado com
-- `texto ~* '\mbloco\M'`, excluindo os bloqueios do triângulo).

UPDATE public.interpretacoes
SET texto = 'O tempo dentro do seu mapa se revela em três leituras complementares: os **Ciclos de Vida**, que dividem a existência em três grandes fases; os **Desafios**, que apontam as barreiras internas a superar em cada fase; e os **Momentos Decisivos**, que indicam as janelas de oportunidade e de escolha dentro de cada ciclo. A seguir, a definição de cada um deles e, na sequência, os seus períodos calculados em ordem cronológica.'
WHERE numero = 1 AND tipo = 'estatico_def_ciclos_intro';
