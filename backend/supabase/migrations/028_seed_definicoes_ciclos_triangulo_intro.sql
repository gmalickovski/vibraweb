-- Migration 028: Seed das introduções dos blocos "Ciclos de Vida, Desafios e
-- Momentos Decisivos" e "Triângulo da Vida e Arcanos" — mesma família de
-- textos estáticos das migrations 007/026/027 (numero=1, tipo
-- `estatico_def_<id>`), lidos como o parágrafo de abertura logo abaixo do
-- título da seção (section-heading) no documento gerado.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_ciclos_intro', 'Introdução — Ciclos de Vida, Desafios e Momentos Decisivos', 'Este bloco reúne três desdobramentos do seu número de Destino, cada um revelando uma camada diferente do mesmo caminho de vida. Os Ciclos de Vida dividem a existência em três grandes fases, cada uma com um clima e um aprendizado próprios. Os Desafios apontam as barreiras internas — carências específicas de habilidades — que tendem a se repetir dentro de cada fase, exigindo maturidade emocional para serem superadas. Já os Momentos Decisivos marcam janelas de tempo mais curtas e intensas dentro de cada ciclo, em que as escolhas feitas costumam pesar mais sobre os rumos seguintes. Lidos em conjunto, esses três elementos formam o mapa temporal do seu destino: o quando, o que precisa ser trabalhado e as oportunidades de virada ao longo da vida.'),

(1, 'estatico_def_triangulo_intro', 'Introdução — Triângulo da Vida e Arcanos', 'O Triângulo da Vida — também chamado de Pirâmide Invertida — é a formação triangular resultante da redução progressiva dos valores numéricos de cada letra do nome de nascimento, par a par, até restar um único número no topo: o Arcano Regente. Cada par de letras adjacentes forma um Arcano, e a sequência completa desses Arcanos ao longo das linhas do triângulo funciona como uma linha do tempo simbólica, indicando fases, aprendizados e possíveis eventos ao longo da existência. Dentro dessas linhas também podem aparecer sequências de três ou mais dígitos repetidos — os chamados bloqueios — que sinalizam pontos de atenção específicos a serem trabalhados conscientemente. Nenhum desses elementos representa uma sentença fixa: são indicações de tendência, sempre sujeitas ao livre-arbítrio e ao esforço de autoconhecimento de cada pessoa.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
