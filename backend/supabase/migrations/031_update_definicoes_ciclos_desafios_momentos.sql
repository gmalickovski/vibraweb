-- Migration 031: Reescreve as definições de Ciclos de Vida, Desafios e
-- Momentos Decisivos com base no documento de referência (NumWeb), incluindo
-- as notas "Importante" de cada categoria. Esses textos agora são exibidos
-- juntos no novo bloco 'cycles-intro' (document-builder.ts), logo após o
-- título da seção e ANTES da sequência cronológica dos ciclos — espelhando a
-- estrutura do documento de referência. Também encurta estatico_def_ciclos_intro
-- (o texto longo duplicava as definições que agora aparecem logo abaixo).

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_ciclos_intro', 'Introdução — Ciclos de Vida, Desafios e Momentos Decisivos', 'Este bloco reúne três leituras complementares do tempo dentro do seu mapa: os **Ciclos de Vida**, que dividem a existência em três grandes fases; os **Desafios**, que apontam as barreiras internas a superar em cada fase; e os **Momentos Decisivos**, que indicam as janelas de oportunidade e de escolha dentro de cada ciclo. A seguir, a definição de cada um deles e, na sequência, os seus períodos calculados em ordem cronológica.'),

(1, 'estatico_def_ciclo', 'Definição de Ciclos de Vida', 'Os Ciclos de Vida representam as circunstâncias e as condições a que o ser humano estará exposto durante determinadas fases da sua vida. São os desdobramentos cíclicos do destino, que transcorrem de acordo com as características do mês, do dia e do ano de nascimento. São três os grandes ciclos da vida, cada um com características peculiares, influenciando as atitudes e as escolhas do ser humano.

**Importante**
Quando um Ciclo de Vida tiver o mesmo número de uma Lição Cármica, o período vigente traz a oportunidade de a Lição Cármica ser aprendida mais rapidamente. Caso haja resistência aos aprendizados da lição cármica, poderão ocorrer algumas dificuldades no período.'),

(1, 'estatico_def_desafio', 'Definição de Desafios', 'Os Desafios indicam as barreiras que se apresentam em cada fase da vida, decorrentes das carências de certas habilidades na personalidade. Estão associados ao processo do amadurecimento psicoemocional, solicitando o equilíbrio entre os seus extremos. Eles surgem como muralhas interpondo-se no caminho do progresso, exigindo superação. Cada desafio tem a sua importância, porém o principal é o que merece maior atenção, pois tende a ser o mais difícil e ressurge, inesperadamente, diante de qualquer situação mais complicada. Os Desafios são as oportunidades para desenvolver as habilidades fracas ou inexistentes.

Quando aparece o desafio 0 (zero), a atenção deve se voltar também para os outros desafios, porquanto poderão surgir vários ou até mesmo todos eles. Se este é o seu caso, recomendamos que leia os textos de todos os desafios e observe em si mesmo quais estão se manifestando.

**Importante**
Quando o número de um Desafio for igual ao número de um Ciclo de Vida, de um Momento Decisivo ou do Destino, no mesmo período poderá se acentuar o nível de estresse emocional, vindo a causar prejuízos à saúde. Isto não determina que a pessoa adoecerá, mas indica um possível aumento das tensões emocionais no período.'),

(1, 'estatico_def_momento_decisivo', 'Definição de Momentos Decisivos', 'Os Momentos Decisivos são ciclos importantes dentro do destino, indicando probabilidades, possibilidades e oportunidades em cada Ciclo de Vida. São as oportunidades que surgem nas diversas áreas da vida, porém com grande ênfase no âmbito profissional. Cada Momento Decisivo indicará qual será a melhor atitude e a melhor escolha a ser feita naquele momento de assumir uma mudança, uma promoção, uma nova empreitada, um novo rumo na vida. O Momento Decisivo indica que há uma decisão importante a ser tomada, com base na escolha consciente, ou por imposição das circunstâncias quando o ser humano se acomoda na zona de conforto.

**Importante**
• Momento Decisivo igual ao número da **Motivação**: durante esses anos, o cenário estará mais favorável às realizações dos ideais, das ambições, da vontade e dos desejos.
• Momento Decisivo igual ao número da **Expressão**: o cenário estará mais favorável ao desenvolvimento dos talentos e das aptidões da personalidade, principalmente nas realizações pessoais e profissionais.
• Momento Decisivo igual ao número do **Destino**: o cenário estará mais favorável às realizações dos projetos pessoais e profissionais, ao progresso humano e à evolução espiritual.
• Momento Decisivo igual a uma **Lição Cármica**: no período vigente se apresentarão as melhores oportunidades de aprendizado relacionadas àquela lição, podendo surgir algumas complicações se houver resistência.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
