-- Migration 017: Seed Textos de Débitos Cármicos
-- Cria os textos interpretativos para os 4 débitos cármicos possíveis (13, 14,
-- 16, 19) — calculados em calcDebitosCarmicos (numerology.ts) a partir do dia
-- de nascimento e das somas de Destino/Motivação/Expressão. Chave usada pela
-- caixa de edição em OutputPanel.tsx (chips de Débitos Cármicos) e por
-- CustomTexts.tsx. Tom e estrutura seguem o mesmo padrão de 008-012 (e do
-- mapa de exemplo): causa em vidas passadas → reflexos na vida atual →
-- caminho de conscientização/regeneração.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(13, 'pessoal_debito_carmico', 'Débito Cármico 13', 'Este débito aponta para uma prova de regeneração ligada à preguiça, à procrastinação ou ao abuso da boa vontade alheia em encarnações passadas — energia mal aplicada, esforço evitado, compromissos assumidos e depois negligenciados. Não se trata de um "castigo", mas de um padrão que precisa ser reequilibrado através do trabalho consistente nesta vida.

Na existência atual, o débito 13 costuma se manifestar como dificuldade para manter disciplina e foco, sensação de que o esforço nunca é suficientemente reconhecido, ou uma resistência interna a rotinas e métodos — mesmo sabendo que são eles que sustentam o progresso. Podem surgir atrasos, obstáculos inesperados e a necessidade de refazer o que foi feito com pressa ou descuido.

A conscientização passa por transformar a disciplina em aliada, não em imposição: organizar o tempo, cumprir o que promete, e principalmente persistir além do primeiro obstáculo. O caminho de regeneração se constrói tijolo por tijolo — cada compromisso honrado é um passo de volta ao equilíbrio.'),

(14, 'pessoal_debito_carmico', 'Débito Cármico 14', 'Este débito está relacionado ao abuso da liberdade em encarnações passadas — excessos, fugas de responsabilidade, mudanças impulsivas que prejudicaram a si mesmo ou a outros, ou o uso irresponsável dos próprios recursos e vícios diversos. É a cobrança pelo desequilíbrio entre liberdade e responsabilidade.

Na existência atual, reflete-se em uma tendência a mudanças bruscas e não planejadas — de casa, de cidade, de emprego, de relacionamento — motivadas por impulsividade mais do que por real necessidade. Também pode surgir como dificuldade em manter constância, oscilações emocionais, ou situações que testam a capacidade de lidar com o inesperado sem perder o rumo.

A regeneração exige desenvolver o discernimento antes da ação: pensar as consequências, moderar os impulsos e usar a liberdade — que é um dos maiores dons desta vibração — de forma consciente e responsável. Adaptar-se sem se dispersar é a lição central deste débito.'),

(16, 'pessoal_debito_carmico', 'Débito Cármico 16', 'Este débito remete a quedas provocadas pelo próprio orgulho em vidas passadas — vaidade excessiva, abuso de poder ou prestígio, traições motivadas por interesse próprio, ou construções erguidas sobre bases falsas que desabaram de forma repentina. É o arquétipo da "torre que cai": algo edificado sem alicerce ético.

Na existência atual, o débito 16 tende a se manifestar como reviravoltas inesperadas — perdas súbitas, desconstruções de planos ou relações que pareciam sólidas, muitas vezes bem no momento em que o sucesso parecia garantido. Pode haver também dificuldade em confiar, medo de expor-se e uma sensibilidade grande à traição ou à decepção.

A conscientização pede humildade genuína, não apenas discurso: rever a base sobre a qual as conquistas são construídas, cultivar a honestidade mesmo quando não é conveniente, e aceitar que reconstruir com verdade é mais duradouro do que sustentar aparências. É um débito que ensina, pela via mais direta, o valor da autenticidade.'),

(19, 'pessoal_debito_carmico', 'Débito Cármico 19', 'Este débito está associado ao egoísmo em encarnações passadas — uso do poder pessoal, do carisma ou da posição para benefício próprio, com pouca ou nenhuma consideração pelas necessidades alheias; a força da individualidade aplicada sem parceria ou solidariedade.

Na existência atual, reflete-se em uma sensação recorrente de ter que "vencer sozinho", dificuldade em pedir e aceitar ajuda, e por vezes o isolamento como consequência de decisões tomadas sem levar os outros em conta. Mesmo com talento e capacidade de realização evidentes, os resultados podem custar mais esforço do que o esperado, como se cada conquista precisasse ser reconquistada.

A regeneração se dá pelo equilíbrio entre a força individual — que este débito não retira, apenas testa — e a cooperação genuína. Aprender a somar esforços, reconhecer méritos alheios e usar a própria capacidade de liderança a serviço de algo maior do que o interesse pessoal é o que transforma o débito em maturidade.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
