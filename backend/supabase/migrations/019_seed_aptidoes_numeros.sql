-- Migration 019: Seed Textos de Aptidões e Potencialidades Profissionais
-- A migration 011 só criou a DEFINIÇÃO da categoria (estatico_def_aptidoes) —
-- nunca populou os 11 textos por número (pessoal_aptidoes, calculado a partir
-- do número de Expressão) usados em document-builder.ts (numEntry
-- 'num-aptidoes') e em OutputPanel.tsx ("Aptidões Profissionais"). Estrutura
-- baseada no texto real de "Potencial Profissional" do mapa de exemplo
-- (Emmanuelle, número 6): parágrafo sobre como o talento se aplica no
-- trabalho + lista de atividades/profissões que costumam se destacar.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_aptidoes', 'Potencial Profissional 1', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da liderança, da iniciativa e da capacidade de abrir novos caminhos onde ainda não existem trilhas prontas. Tem mais êxito em atividades que oferecem autonomia real e espaço para decidir e comandar, do que em funções que exigem seguir instruções alheias sem margem de criação.

Algumas atividades se destacam — empreendedorismo, direção geral, gerência de projetos, vendas de alto impacto, política, esportes de competição, consultoria estratégica, liderança militar ou policial, criação de startups, direção artística, arquitetura de novos negócios.'),

(2, 'pessoal_aptidoes', 'Potencial Profissional 2', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da diplomacia, da escuta e da capacidade de fazer parcerias funcionarem. Tem mais êxito em atividades que envolvem mediação, apoio e cooperação próxima do que em papéis que exigem confronto direto ou decisões solitárias.

Algumas atividades se destacam — recursos humanos, diplomacia, mediação e conciliação, psicologia, terapias de casal e família, atendimento ao cliente, parcerias comerciais, consultoria em relacionamentos, curadoria, assessoria, trabalhos em dupla ou equipe reduzida.'),

(3, 'pessoal_aptidoes', 'Potencial Profissional 3', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da comunicação, da criatividade e da capacidade de emocionar e entreter. Tem mais êxito em atividades que permitem expressão livre e contato com o público do que em rotinas repetitivas e silenciosas.

Algumas atividades se destacam — comunicação, jornalismo, publicidade, artes cênicas, música, redação criativa, marketing de conteúdo, design, moda, produção de eventos, influência digital, ensino de artes e humanidades.'),

(4, 'pessoal_aptidoes', 'Potencial Profissional 4', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da organização, do planejamento e da construção de estruturas sólidas. Tem mais êxito em atividades que recompensam método e consistência do que em ambientes caóticos ou de mudança constante e sem direção clara.

Algumas atividades se destacam — engenharia, arquitetura, contabilidade, administração, gestão de projetos, construção civil, direito, planejamento financeiro, logística, auditoria, agronomia, TI de infraestrutura.'),

(5, 'pessoal_aptidoes', 'Potencial Profissional 5', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da versatilidade, da comunicação dinâmica e da capacidade de se adaptar rápido a diferentes contextos. Tem mais êxito em atividades que envolvem movimento, variedade e liberdade de rotina do que em cargos fixos e repetitivos.

Algumas atividades se destacam — vendas, turismo, jornalismo, marketing, comércio exterior, relações públicas, aviação, produção de conteúdo, tradução, representação comercial, atividades que envolvam viagens frequentes.'),

(6, 'pessoal_aptidoes', 'Potencial Profissional 6', 'Pelo seu número de Expressão, revelam-se as suas principais aptidões e potencialidades profissionais, porquanto elas precisam ser conjugadas com o seu número de Destino, pois é ele que revela o plano da vida enquanto estiver na existência física.

Poderá atuar profissionalmente em todas as atividades que envolvam o ser humano e seu bem-estar geral, e terá mais êxito quando, na atividade profissional escolhida, surgem oportunidades de ajustar todos da equipe numa atmosfera de harmonia e paz.

Algumas atividades se destacam — educação, ensino, artista, administração hospitalar, bibliotecário, corretor de imóveis, cozinheiro, camareiro, compositor, decoração, desenhista técnico, estatístico, enfermagem, historiador, gerente/administrador de restaurante, fotografia, floricultura, pecuária, veterinária, investigador, música, mecânica, medicina, mordomia, matemática, nutricionista, psicologia, redator, serviço público, terapias em geral, advocacia, comércio de móveis, comércio de artesanato, comércio de vestuário e acessórios, comércio de alimentos, assistente social, ator/atriz, decoração de interiores, jardinagem, recursos humanos, escritor, consultoria.'),

(7, 'pessoal_aptidoes', 'Potencial Profissional 7', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da análise, da pesquisa e do aprofundamento técnico ou espiritual. Tem mais êxito em atividades que valorizam a especialização e o pensamento crítico do que em funções superficiais ou de contato social intenso e constante.

Algumas atividades se destacam — pesquisa científica, filosofia, teologia, psicanálise, tecnologia da informação, engenharia de dados, perícia técnica, escrita especializada, astrologia e ciências ocultas, medicina diagnóstica, docência em nível avançado, consultoria estratégica.'),

(8, 'pessoal_aptidoes', 'Potencial Profissional 8', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da gestão, das finanças e da capacidade de liderar em grande escala. Tem mais êxito em atividades que envolvem poder de decisão, resultados mensuráveis e responsabilidade financeira do que em papéis operacionais sem autonomia.

Algumas atividades se destacam — direção executiva, finanças e investimentos, direito empresarial, imobiliário, engenharia de grande porte, política, banca, empreendedorismo de escala, consultoria em gestão, comércio internacional, indústria.'),

(9, 'pessoal_aptidoes', 'Potencial Profissional 9', 'Pelo seu número de Expressão, suas principais aptidões giram em torno do serviço humanitário, da arte com propósito e da capacidade de inspirar em larga escala. Tem mais êxito em atividades que conectam talento pessoal a causas coletivas do que em funções voltadas apenas para ganho individual.

Algumas atividades se destacam — medicina, ONGs e causas sociais, artes com forte apelo emocional, diplomacia internacional, educação humanitária, direito humanitário, terapias alternativas, filantropia, produção cultural, liderança espiritual.'),

(11, 'pessoal_aptidoes', 'Potencial Profissional 11', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da inspiração, da intuição aplicada e da capacidade de trazer ideias originais que ainda não existem no mercado. Tem mais êxito em atividades que dão espaço para visão e criatividade do que em rotinas puramente operacionais e sem propósito claro.

Algumas atividades se destacam — inovação e criação de produtos, palestras e liderança inspiracional, artes visionárias, espiritualidade e terapias energéticas, invenção e design conceitual, educação transformadora, ciências de ponta, ativismo por causas emergentes.'),

(22, 'pessoal_aptidoes', 'Potencial Profissional 22', 'Pelo seu número de Expressão, suas principais aptidões giram em torno da construção de grandes projetos com impacto duradouro. Tem mais êxito em atividades que combinam visão ampla com execução prática e disciplinada do que em empreitadas pequenas ou de curto prazo, que tendem a limitar seu potencial real.

Algumas atividades se destacam — grandes obras de engenharia e arquitetura, fundação e direção de organizações, planejamento urbano, liderança de projetos internacionais, filantropia estruturada, política de estado, construção de instituições educacionais ou de saúde.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
