-- Migration 003: seed interpretation texts for new numerology sections
-- Safe to re-run: INSERT ... ON CONFLICT (numero, tipo) DO NOTHING

-- Note: interpretacoes_numero_tipo_key constraint already exists from migration 001.
-- ============================================================
-- pessoal_missao (Missão de Vida = Expressão + Destino)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_missao', 'Missão 1 — Liderança e Autonomia', 'Sua missão é trilhar caminhos independentes e inspirar outros pelo exemplo. Você veio para liderar e inovar, desbravando territórios ainda não explorados. O desafio é superar a tendência ao isolamento e abraçar parcerias que potencializem sua jornada.'),
(2, 'pessoal_missao', 'Missão 2 — Harmonia e Cooperação', 'Sua missão envolve cultivar relacionamentos equilibrados e atuar como mediador nos conflitos ao seu redor. Você veio para ensinar que a paz é construída com escuta ativa e empatia. O principal desafio é vencer a sensibilidade excessiva e confiar em seus próprios julgamentos.'),
(3, 'pessoal_missao', 'Missão 3 — Expressão e Criatividade', 'Sua missão é inspirar o mundo por meio da arte, da comunicação e da alegria. Você carrega o dom de transformar emoções em beleza e sua expressão criativa tem o poder de elevar as pessoas. O desafio é manter o foco e evitar dispersar sua energia.'),
(4, 'pessoal_missao', 'Missão 4 — Estrutura e Construção', 'Sua missão é edificar bases sólidas — seja na família, no trabalho ou na sociedade. Você veio para organizar, planejar e concretizar o que outros apenas sonham. O desafio é equilibrar a rigidez com a flexibilidade necessária para crescer.'),
(5, 'pessoal_missao', 'Missão 5 — Liberdade e Transformação', 'Sua missão é promover mudanças e expandir consciências. Você veio para viver experiências múltiplas e compartilhar os aprendizados dessa jornada. O desafio é dominar os impulsos e usar a liberdade com responsabilidade.'),
(6, 'pessoal_missao', 'Missão 6 — Amor e Responsabilidade', 'Sua missão é servir com amor e criar ambientes de cura e harmonia. Você carrega a vocação de cuidador e o dom de encontrar beleza onde outros enxergam imperfeição. O desafio é aprender a receber tanto quanto doa.'),
(7, 'pessoal_missao', 'Missão 7 — Sabedoria e Espiritualidade', 'Sua missão é aprofundar o conhecimento e compartilhar insights que elevem a humanidade. Você veio para questionar, pesquisar e conectar o visível ao invisível. O desafio é sair do isolamento e confiar nas pessoas ao seu redor.'),
(8, 'pessoal_missao', 'Missão 8 — Poder e Abundância', 'Sua missão é demonstrar que prosperidade material e ética andam juntas. Você veio para construir, liderar e distribuir recursos de forma justa. O desafio é não deixar que o apego ao poder corrompa seus valores mais profundos.'),
(9, 'pessoal_missao', 'Missão 9 — Compaixão e Humanidade', 'Sua missão é servir à humanidade com amor incondicional, disseminando sabedoria e compaixão. Você veio para concluir ciclos e ajudar outros a fazerem o mesmo. O desafio é desapegar do passado e confiar no processo de renovação.'),
(11, 'pessoal_missao', 'Missão 11 — Iluminação e Inspiração', 'Número mestre: sua missão é ser um canal de luz e inspiração. Você veio para elevar a consciência coletiva e mostrar que o espiritual e o material não se opõem. O desafio é lidar com a intensidade emocional que este caminho exige.'),
(22, 'pessoal_missao', 'Missão 22 — O Grande Construtor', 'Número mestre: sua missão é materializar sonhos grandiosos em benefício de muitos. Você tem a visão do 11 e a capacidade construtiva do 4 — a combinação mais poderosa da numerologia. O desafio é sustentar a pressão que acompanha tanta responsabilidade.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_talentoOculto (Motivação + Expressão)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_talentoOculto', 'Talento Oculto 1 — Iniciativa Natural', 'Você possui um talento inato para iniciar projetos e abrir caminhos. Mesmo sem perceber, irradia uma energia pioneira que inspira quem está ao redor a agir. Ao reconhecer esse dom, pode canalizá-lo para realizações ainda maiores.'),
(2, 'pessoal_talentoOculto', 'Talento Oculto 2 — Diplomacia Silenciosa', 'Sua capacidade de perceber o que não é dito e harmonizar situações tensas é um talento raro. Você naturalmente equilibra os extremos e cria pontes onde outros só enxergam barreiras.'),
(3, 'pessoal_talentoOculto', 'Talento Oculto 3 — Encantamento pelo Verbo', 'Palavras fluem de você com uma leveza que encanta e convence. Seja na fala, na escrita ou nas artes, sua expressão tem o poder de mover corações sem esforço aparente.'),
(4, 'pessoal_talentoOculto', 'Talento Oculto 4 — Precisão e Método', 'Sua mente organiza informações com uma clareza invulgar. Você enxerga a ordem por trás do caos e sabe exatamente quais passos levar para transformar uma ideia em realidade concreta.'),
(5, 'pessoal_talentoOculto', 'Talento Oculto 5 — Adaptabilidade', 'Você se reinventa com uma facilidade que poucos possuem. Em ambientes de mudança constante, enquanto outros travam, você floresce — um talento extraordinário no mundo acelerado de hoje.'),
(6, 'pessoal_talentoOculto', 'Talento Oculto 6 — Cura pelo Afeto', 'Sua presença tem um efeito balsâmico nas pessoas. Sem precisar de palavras, você transmite segurança e amor, criando espaços onde as pessoas se sentem aceitas e podem se curar.'),
(7, 'pessoal_talentoOculto', 'Talento Oculto 7 — Perspicácia Analítica', 'Sua mente penetra nas camadas mais profundas de qualquer assunto. Você identifica padrões ocultos e tira conclusões que outros levariam anos para alcançar.'),
(8, 'pessoal_talentoOculto', 'Talento Oculto 8 — Magnetismo para Oportunidades', 'Você possui um radar natural para identificar onde o valor está sendo subutilizado e como convertê-lo em resultado. Liderança e prosperidade são seus talentos mais naturais.'),
(9, 'pessoal_talentoOculto', 'Talento Oculto 9 — Presença Transformadora', 'Você transforma ambientes e pessoas apenas estando presente. Sua sabedoria, mesmo quando não verbalizada, eleva o nível de qualquer conversa ou grupo.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_psiquico (Número do Dia de Nascimento)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_psiquico', 'Psíquico 1 — O Líder', 'Nasceu para liderar. Sua energia vital é focada, determinada e independente. Você tem um forte instinto de pioneirismo e uma necessidade natural de ser o primeiro ou o melhor no que faz.'),
(2, 'pessoal_psiquico', 'Psíquico 2 — O Diplomata', 'Sua sensibilidade é aguçada e sua capacidade de captar emoções alheias é extraordinária. Você percebe nuances que outros ignoram, o que o torna um parceiro excepcional em qualquer relacionamento.'),
(3, 'pessoal_psiquico', 'Psíquico 3 — O Criativo', 'Sua energia transborda criatividade e sociabilidade. Você foi feito para se expressar — seja pela arte, pelo humor ou pela comunicação — e tem o dom de iluminar os ambientes por onde passa.'),
(4, 'pessoal_psiquico', 'Psíquico 4 — O Construtor', 'Você tem uma energia metódica e persistente. Onde outros desistem, você insiste — e essa resiliência é o que transforma seus sonhos em realizações concretas e duradouras.'),
(5, 'pessoal_psiquico', 'Psíquico 5 — O Aventureiro', 'Sua energia vital é dinâmica e inquieta. Você precisa de variedade, de novos estímulos e de liberdade para se mover. Rotinas rígidas sufocam seu potencial; a mudança é seu oxigênio.'),
(6, 'pessoal_psiquico', 'Psíquico 6 — O Cuidador', 'Você tem uma energia amorosa e protetora. Sua satisfação mais profunda vem de nutrir os que ama e de criar ambientes de beleza, conforto e harmonia ao seu redor.'),
(7, 'pessoal_psiquico', 'Psíquico 7 — O Pensador', 'Sua energia é introspectica e analítica. Você processa o mundo de dentro para fora e possui uma intuição poderosa que se torna ainda mais precisa quando você aprende a confiar nela.'),
(8, 'pessoal_psiquico', 'Psíquico 8 — O Realizador', 'Você tem uma energia voltada para resultados e conquistas. Sua capacidade de trabalho é notável e você possui uma compreensão intuitiva do mundo dos negócios e das finanças.'),
(9, 'pessoal_psiquico', 'Psíquico 9 — O Sábio', 'Sua energia é ampla, generosa e voltada para o coletivo. Você carrega a sabedoria de muitas experiências e tem uma capacidade natural de ver o quadro maior além dos detalhes cotidianos.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_licao_carmica (Números ausentes no nome)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_licao_carmica', 'Lição Cármica 1 — Desenvolver Autoconfiança', 'A ausência do número 1 indica que nesta vida você aprenderá a afirmar sua voz e confiar em si mesmo. O desafio é superar a dependência da aprovação alheia e assumir a liderança da própria vida.'),
(2, 'pessoal_licao_carmica', 'Lição Cármica 2 — Cultivar Paciência', 'Você está aprendendo a desacelerar, ouvir mais e colaborar. A impulsividade pode ter sido um padrão em vidas anteriores; agora é hora de desenvolver a diplomacia e a sensibilidade nas relações.'),
(3, 'pessoal_licao_carmica', 'Lição Cármica 3 — Libertar a Expressão', 'Existe uma timidez ou bloqueio criativo a ser superado. Esta vida pede que você se expresse com mais leveza, compartilhe suas ideias e permita que sua alegria interior apareça para o mundo.'),
(4, 'pessoal_licao_carmica', 'Lição Cármica 4 — Aprender Disciplina', 'A organização e a persistência são habilidades a desenvolver. Você está aprendendo que grandes conquistas exigem estrutura, planejamento e a disposição de trabalhar de forma consistente.'),
(5, 'pessoal_licao_carmica', 'Lição Cármica 5 — Abraçar a Mudança', 'O medo do desconhecido pode paralisar sua evolução. Esta vida pede que você se arrisque, experimente coisas novas e confie que a mudança é sempre um convite ao crescimento.'),
(6, 'pessoal_licao_carmica', 'Lição Cármica 6 — Equilibrar Cuidado e Limites', 'Você está aprendendo a cuidar sem se perder. O desafio é discernir quando ajudar genuinamente serve e quando criar limites saudáveis é a expressão mais elevada do amor.'),
(7, 'pessoal_licao_carmica', 'Lição Cármica 7 — Aprofundar o Autoconhecimento', 'Esta vida pede introspecção e busca espiritual. Você está sendo chamado a ir além da superfície das coisas e a encontrar significado nas experiências que inicialmente parecem inexplicáveis.'),
(8, 'pessoal_licao_carmica', 'Lição Cármica 8 — Equilíbrio com o Poder', 'Você está aprendendo a lidar com dinheiro, autoridade e reconhecimento de forma ética. O desafio é exercer poder sem abuso e construir abundância que beneficie também quem está ao redor.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_desafio (Desafios de vida)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(0, 'pessoal_desafio', 'Desafio 0 — Maestria Total', 'O desafio zero é o mais raro e indica que você veio com domínio sobre todas as áreas da vida. Isso não significa ausência de dificuldades, mas sim a capacidade inata de superá-las em qualquer frente.'),
(1, 'pessoal_desafio', 'Desafio 1 — Construir Independência', 'Seu desafio é desenvolver autonomia e superar a tendência de seguir caminhos alheios por medo de falhar. Aprenda a confiar no seu próprio julgamento e aja mesmo sem a certeza do resultado.'),
(2, 'pessoal_desafio', 'Desafio 2 — Superar a Sensibilidade Excessiva', 'Você tende a absorver as emoções ao redor de forma intensa, o que pode paralisar suas decisões. O desafio é manter sua sensibilidade como um dom sem deixá-la se tornar uma vulnerabilidade.'),
(3, 'pessoal_desafio', 'Desafio 3 — Desenvolver Foco', 'Sua criatividade é abundante, mas a dispersão pode impedir que projetos cheguem ao fim. O desafio é escolher um caminho, aprofundar-se nele e concluir o que começa.'),
(4, 'pessoal_desafio', 'Desafio 4 — Flexibilizar a Rigidez', 'Você tende a se apegar a regras e rotinas de forma rígida. O desafio é aprender que a estrutura é um meio, não um fim, e que a adaptabilidade é tão valiosa quanto a disciplina.'),
(5, 'pessoal_desafio', 'Desafio 5 — Usar a Liberdade com Responsabilidade', 'A busca por novas experiências pode resultar em instabilidade e fuga das responsabilidades. O desafio é encontrar o equilíbrio entre a aventura e os compromissos que sustentam sua vida.'),
(6, 'pessoal_desafio', 'Desafio 6 — Servir sem se Sacrificar', 'Seu impulso de cuidar pode levá-lo a se colocar em último lugar constantemente. O desafio é aprender que seu bem-estar é tão importante quanto o dos outros e que dizer não também é um ato de amor.'),
(7, 'pessoal_desafio', 'Desafio 7 — Abrir-se para o Outro', 'A tendência ao isolamento e ao perfeccionismo pode criar barreiras nos relacionamentos. O desafio é desenvolver confiança e se permitir vulnerável, reconhecendo que a conexão humana é parte essencial do seu crescimento.'),
(8, 'pessoal_desafio', 'Desafio 8 — Equilíbrio entre Matéria e Espírito', 'A busca por poder e reconhecimento pode desequilibrar sua vida interior. O desafio é lembrar que a verdadeira riqueza inclui saúde, relacionamentos e paz — não apenas conquistas materiais.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_ciclo (Ciclos de Vida)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_ciclo', 'Ciclo Regente 1 — Início e Independência', 'Este ciclo é marcado pelo desenvolvimento da individualidade e da autoconfiança. É um período propício para novos começos, iniciativas pessoais e a construção de uma identidade sólida.'),
(2, 'pessoal_ciclo', 'Ciclo Regente 2 — Cooperação e Intuição', 'Um ciclo de parcerias, sensibilidade e aprendizado relacional. A intuição se aprofunda e as conexões construídas agora tendem a ser duradouras. Paciência é a palavra-chave.'),
(3, 'pessoal_ciclo', 'Ciclo Regente 3 — Expressão e Crescimento', 'Este é um ciclo de florescimento criativo e expansão social. A autoexpressão, o entusiasmo e a alegria de viver dominam este período. É um momento favorável para criar e compartilhar.'),
(4, 'pessoal_ciclo', 'Ciclo Regente 4 — Construção e Estabilidade', 'Um ciclo voltado para trabalho duro, estrutura e consolidação. As bases que você construir agora durarão décadas. Disciplina e persistência são as ferramentas deste período.'),
(5, 'pessoal_ciclo', 'Ciclo Regente 5 — Mudança e Experiência', 'Este ciclo traz transformações, viagens e novos horizontes. A vida pede que você se adapte e abrace o inesperado. Mudanças que pareciam perturbadoras revelam-se libertadoras.'),
(6, 'pessoal_ciclo', 'Ciclo Regente 6 — Família e Responsabilidade', 'Um ciclo centrado no lar, nos vínculos afetivos e nas responsabilidades. É um período de cura relacional e de construção de um ambiente harmonioso para si e para quem ama.'),
(7, 'pessoal_ciclo', 'Ciclo Regente 7 — Reflexão e Espiritualidade', 'Este ciclo convida ao recolhimento, ao estudo e ao aprofundamento espiritual. É um período de grande crescimento interior, mesmo que exteriormente pareça mais quieto.'),
(8, 'pessoal_ciclo', 'Ciclo Regente 8 — Realização e Poder', 'Um ciclo de grandes realizações materiais e profissionais. Oportunidades de liderança e expansão financeira surgem para quem se preparou. O foco e a determinação são recompensados.'),
(9, 'pessoal_ciclo', 'Ciclo Regente 9 — Conclusão e Sabedoria', 'Um ciclo de encerramento de capítulos e colheita de aprendizados. Tudo o que não serve mais precisa ser liberado para abrir espaço ao que vem a seguir. Generosidade e desapego são os temas centrais.'),
(11, 'pessoal_ciclo', 'Ciclo Regente 11 — Iluminação Mestra', 'Um ciclo de alta sensibilidade e propósito elevado. As experiências deste período tendem a ser intensas e transformadoras. Confiar na intuição é fundamental para navegar este ciclo com sabedoria.'),
(22, 'pessoal_ciclo', 'Ciclo Regente 22 — Construção Mestra', 'O ciclo mais poderoso da numerologia. Grandes projetos que impactam muitas pessoas podem ser iniciados ou concluídos neste período. A responsabilidade é proporcional ao potencial.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_momentoDecisivo (Momentos Decisivos)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_momentoDecisivo', 'Momento Decisivo 1 — Nova Trajetória', 'Este momento marca uma virada para a independência e a liderança. Uma oportunidade de reinvenção se apresenta e o universo favorece quem toma a iniciativa com coragem e clareza.'),
(2, 'pessoal_momentoDecisivo', 'Momento Decisivo 2 — Parcerias Transformadoras', 'Uma relação ou sociedade importante ganha destaque neste momento. Colaboração, paciência e abertura para o outro são as chaves para aproveitar ao máximo este ciclo.'),
(3, 'pessoal_momentoDecisivo', 'Momento Decisivo 3 — Expressão em Destaque', 'Este momento pede que sua voz seja ouvida. Projetos criativos, comunicação e expansão social trazem realizações significativas. Não se cale — o mundo precisa do que você tem a dizer.'),
(4, 'pessoal_momentoDecisivo', 'Momento Decisivo 4 — Consolidação', 'Um momento de trabalho sólido e construção de fundações. O esforço neste período cria estruturas que sustentarão as próximas décadas da sua vida.'),
(5, 'pessoal_momentoDecisivo', 'Momento Decisivo 5 — Grande Mudança', 'Uma transformação significativa se avizinha. Resistir a ela custa mais do que fluir. Este momento é um convite à renovação profunda — abrace-o com mente aberta.'),
(6, 'pessoal_momentoDecisivo', 'Momento Decisivo 6 — Vínculos e Cura', 'Relações familiares e afetivas ganham protagonismo. Este momento traz oportunidades de reconciliação, cuidado e construção de um lar mais harmonioso.'),
(7, 'pessoal_momentoDecisivo', 'Momento Decisivo 7 — Revelação Interior', 'Um período de descobertas profundas sobre si mesmo e sobre o mundo. Insights poderosos surgem em silêncio. Mergulhe no autoconhecimento e confie na sua percepção.'),
(8, 'pessoal_momentoDecisivo', 'Momento Decisivo 8 — Ascensão Material', 'Oportunidades de crescimento financeiro e profissional se abrem neste momento. Sua capacidade de liderança e de gestão de recursos é colocada à prova — e recompensada.'),
(9, 'pessoal_momentoDecisivo', 'Momento Decisivo 9 — Fechamento de Ciclo', 'Este momento pede o encerramento de capítulos e a liberação do que não serve mais. Quanto mais você desapega, mais espaço cria para novas e melhores experiências.'),
(11, 'pessoal_momentoDecisivo', 'Momento Decisivo 11 — Chamado Superior', 'Um momento de propósito elevado e chamado espiritual. Intuições poderosas guiam seus passos. Confie nos sinais — algo muito maior está se organizando em seu favor.'),
(22, 'pessoal_momentoDecisivo', 'Momento Decisivo 22 — Realização Máxima', 'Este é um dos momentos mais poderosos da sua jornada numerológica. Sonhos ambiciosos têm o respaldo do universo para se concretizarem. Aja com visão e responsabilidade.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_harmoniaConjugal (Harmonia nos relacionamentos)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 1', 'Pessoas com vibração 1 buscam parceiros que admirem sua independência. A melhor química se estabelece com quem compartilha ambições e respeita o espaço individual sem se sentir ameaçado.'),
(2, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 2', 'O número 2 floresce em relacionamentos de cumplicidade profunda. Parceiros que valorizam a sensibilidade e a escuta ativa criam os vínculos mais duradouros com essa vibração.'),
(3, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 3', 'O 3 ama leveza, humor e criatividade compartilhada. Relacionamentos que permitem a expressão livre e trazem alegria são os que mais nutrem essa vibração.'),
(4, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 4', 'Estabilidade e lealdade são os pilares do amor para o número 4. Parceiros confiáveis, honestos e comprometidos com construções de longo prazo são os ideais para essa vibração.'),
(5, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 5', 'O 5 precisa de liberdade dentro da relação. Parceiros que abraçam a espontaneidade, não sufocam e estão abertos a aventuras criam relacionamentos vibrantes e duradouros.'),
(6, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 6', 'O amor para o número 6 é profundo e devoto. A melhor parceria é com quem valoriza família, beleza e o cuidado mútuo, sem explorar a generosidade natural dessa vibração.'),
(7, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 7', 'O 7 precisa de um parceiro que respeite sua necessidade de silêncio e profundidade intelectual. Relacionamentos superficiais não sustentam essa vibração por muito tempo.'),
(8, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 8', 'O número 8 busca parceiros que compartilhem ambições e entendam o ritmo intenso de quem está em constante construção. Admiração mútua e igualdade de forças são essenciais.'),
(9, 'pessoal_harmoniaConjugal', 'Harmonia Conjugal — Número 9', 'O 9 ama de forma universal e generosa. A melhor parceria é com quem compartilha valores humanitários e entende que o amor desta vibração transcende os limites do relacionamento a dois.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_tendenciaOculta (Números com 3+ ocorrências no nome)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_tendenciaOculta', 'Tendência Oculta 1 — Ímpeto de Liderança', 'A repetição do número 1 no seu nome revela um ímpeto natural para liderar e iniciar. Você pode parecer mais seguro do que sente por dentro, mas essa energia impulsionadora é genuína e poderosa.'),
(2, 'pessoal_tendenciaOculta', 'Tendência Oculta 2 — Hipersensibilidade', 'O excesso do número 2 indica uma sensibilidade amplificada. Você sente o ambiente ao seu redor de forma intensa, o que pode ser tanto um dom de empatia quanto uma vulnerabilidade emocional.'),
(3, 'pessoal_tendenciaOculta', 'Tendência Oculta 3 — Exuberância Criativa', 'A abundância do número 3 no nome cria uma expressividade vibrante e magnética. Você chama atenção naturalmente e sua energia criativa pode ser canalizada para realizações notáveis.'),
(4, 'pessoal_tendenciaOculta', 'Tendência Oculta 4 — Compulsão por Ordem', 'A predominância do 4 indica uma necessidade intensa de controle e organização. Quando bem equilibrada, é fonte de grandes realizações; quando exagerada, pode gerar rigidez e ansiedade.'),
(5, 'pessoal_tendenciaOculta', 'Tendência Oculta 5 — Inquietude Criativa', 'O excesso de 5 gera uma energia nervosa e multifacetada. A vida raramente parece suficientemente estimulante. O desafio é canalizar essa vitalidade sem cair na dispersão.'),
(6, 'pessoal_tendenciaOculta', 'Tendência Oculta 6 — Excesso de Responsabilidade', 'A repetição do 6 cria uma tendência a assumir mais responsabilidades do que é saudável. Cuidar dos outros é um dom, mas o autocuidado precisa ser igualmente prioritário.'),
(7, 'pessoal_tendenciaOculta', 'Tendência Oculta 7 — Introspecção Profunda', 'A abundância do 7 aprofunda o mundo interior de forma excepcional. Você pensa em camadas e percebe detalhes que outros ignoram, mas o isolamento pode ser um risco.'),
(8, 'pessoal_tendenciaOculta', 'Tendência Oculta 8 — Obsessão por Resultados', 'O excesso de 8 cria uma mente voltada para conquistas e eficiência. O perigo é perder de vista o processo e as relações em nome dos resultados.'),
(9, 'pessoal_tendenciaOculta', 'Tendência Oculta 9 — Idealismo Elevado', 'A repetição do 9 gera um idealismo profundo e uma sensibilidade universal. Você sente as injustiças do mundo de forma visceral e pode carregar o peso do coletivo mais do que deveria.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_respostaSubconsciente (9 - licoesCarmicas.length)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(0, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 0 — Vulnerabilidade Total', 'Todos os 9 números estão ausentes no seu nome, indicando uma jornada de aprendizado amplo nesta vida. Você reage ao mundo de forma imprevisível, pois ainda está desenvolvendo seus recursos internos.'),
(1, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 1 — Recursos Escassos', 'Apenas 1 número está presente no seu nome. Diante de situações desafiadoras, você conta com poucos mecanismos internos automáticos. O desenvolvimento consciente das suas habilidades é fundamental.'),
(2, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 2 — Base em Construção', 'Com poucos números presentes no nome, você reage aos desafios de forma ainda incerta. Esta é uma jornada de construção de recursos e autoconhecimento.'),
(3, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 3 — Equilíbrio em Desenvolvimento', 'Você já possui alguns recursos internos consolidados, mas ainda há muito a desenvolver. Sua resposta às situações difíceis vai amadurecendo ao longo das experiências.'),
(4, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 4 — Meia Força', 'Você reage aos desafios com uma combinação de recursos estabelecidos e vulnerabilidades a trabalhar. A autoconsciência é a chave para otimizar sua resposta ao mundo.'),
(5, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 5 — Recursos Emergentes', 'Mais da metade dos recursos internos estão desenvolvidos. Você já possui uma capacidade razoável de lidar com desafios, embora ainda existam áreas de vulnerabilidade.'),
(6, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 6 — Base Sólida', 'Você conta com um conjunto robusto de recursos subconscientes. Diante de adversidades, sua resposta tende a ser equilibrada e eficaz na maioria das situações.'),
(7, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 7 — Alta Capacidade', 'Seu subconsciente está bem equipado para lidar com os desafios da vida. Você reage com uma naturalidade que surpreende — mesmo em crises, uma parte de você permanece serena.'),
(8, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 8 — Quase Completo', 'Você possui quase todos os recursos internos necessários, com apenas uma lição cármica a integrar. Sua capacidade de resposta ao ambiente é notavelmente desenvolvida.'),
(9, 'pessoal_respostaSubconsciente', 'Resposta Subconsciente 9 — Mestria', 'Todos os 9 números estão presentes no seu nome. Seu subconsciente está completamente equipado para lidar com qualquer situação que a vida apresentar. Esta é uma condição rara e poderosa.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_diaPessoal (Dia Pessoal atual)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_diaPessoal', 'Dia Pessoal 1 — Inicie', 'Um dia poderoso para começar algo novo. Tome decisões, assine contratos ou dê o primeiro passo naquele projeto que você vem adiando. Sua energia está no pico da iniciativa.'),
(2, 'pessoal_diaPessoal', 'Dia Pessoal 2 — Coopere', 'Um dia favorável para parcerias, conversas delicadas e negociações. Sua sensibilidade está aguçada — ouça mais do que fala e preste atenção aos sinais sutis ao seu redor.'),
(3, 'pessoal_diaPessoal', 'Dia Pessoal 3 — Expresse', 'Um dia ideal para comunicação, criatividade e encontros sociais. Escreva, apresente suas ideias, socialize. Sua expressão está no fluxo e as palavras chegam com facilidade.'),
(4, 'pessoal_diaPessoal', 'Dia Pessoal 4 — Organize', 'Um dia para colocar a casa em ordem — literal e metaforicamente. Tarefas práticas, organização e trabalho sistemático trazem satisfação. Concentre-se no que é concreto e realizável.'),
(5, 'pessoal_diaPessoal', 'Dia Pessoal 5 — Mova-se', 'Um dia de mudanças e descobertas. Saia da rotina, explore novos lugares ou perspectivas. Inesperados podem aparecer — abrace-os como oportunidades, não como obstáculos.'),
(6, 'pessoal_diaPessoal', 'Dia Pessoal 6 — Cuide', 'Um dia voltado para família, lar e responsabilidades afetivas. É um bom momento para resolver questões domésticas, reconectar com quem ama e oferecer ou pedir ajuda.'),
(7, 'pessoal_diaPessoal', 'Dia Pessoal 7 — Reflita', 'Um dia de introspecção e descanso mental. Evite decisões importantes e aproveite para estudar, meditar ou simplesmente recarregar as energias. A intuição está especialmente ativa.'),
(8, 'pessoal_diaPessoal', 'Dia Pessoal 8 — Realize', 'Um dia poderoso para negócios, finanças e execução de projetos ambiciosos. Sua energia de realização está em alta — use-a para avançar em metas concretas e relevantes.'),
(9, 'pessoal_diaPessoal', 'Dia Pessoal 9 — Conclua', 'Um dia para terminar o que começou, liberar o que não serve e fechar ciclos. Pratique a generosidade e o perdão — seu bem-estar neste dia depende do quanto você consegue soltar.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_mesPessoal (Meses Pessoais)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_mesPessoal', 'Mês Pessoal 1 — Novos Começos', 'Este mês marca o início de um novo ciclo de 9. Plante as sementes do que deseja colher nos próximos anos. Tome iniciativas, assuma novas responsabilidades e afirme sua direção com clareza.'),
(2, 'pessoal_mesPessoal', 'Mês Pessoal 2 — Desenvolvimento', 'Um mês para cultivar o que foi iniciado no mês anterior. Parcerias, paciência e atenção aos detalhes são a chave. Não force resultados — este é um período de crescimento silencioso.'),
(3, 'pessoal_mesPessoal', 'Mês Pessoal 3 — Expressão', 'Um mês de expansão social, criatividade e comunicação. Compartilhe seus projetos, conecte-se com pessoas e deixe sua alegria de viver aparecer. Oportunidades chegam através de contatos.'),
(4, 'pessoal_mesPessoal', 'Mês Pessoal 4 — Construção', 'Um mês de trabalho sólido e organização. Construa as fundações que sustentarão seus projetos. Evite atalhos — o esforço genuíno deste período cria estruturas duradouras.'),
(5, 'pessoal_mesPessoal', 'Mês Pessoal 5 — Mudança', 'Um mês de transformações e surpresas. A vida pede adaptabilidade. Viagens, mudanças de planos e novos encontros marcam este período. Abra-se para o inesperado.'),
(6, 'pessoal_mesPessoal', 'Mês Pessoal 6 — Harmonia', 'Um mês voltado para relacionamentos, família e responsabilidades afetivas. É uma boa época para resolver questões domésticas, melhorar a saúde e fortalecer vínculos importantes.'),
(7, 'pessoal_mesPessoal', 'Mês Pessoal 7 — Reflexão', 'Um mês de introspecção, estudo e recolhimento. O crescimento deste período acontece principalmente por dentro. Meditação, leitura e análise profunda trazem os maiores presentes.'),
(8, 'pessoal_mesPessoal', 'Mês Pessoal 8 — Realização', 'Um mês de grandes oportunidades profissionais e financeiras. Sua capacidade de liderança está em evidência. Aja com determinação e aproveite a energia favorável para avanços significativos.'),
(9, 'pessoal_mesPessoal', 'Mês Pessoal 9 — Conclusão', 'Um mês de encerramento e colheita. Conclua projetos, libere o que não serve mais e prepare-se para um novo ciclo que se aproxima. Generosidade e gratidão potencializam este período.')
ON CONFLICT (numero, tipo) DO NOTHING;

-- ============================================================
-- pessoal_arcanoAtual (Arcano Atual / Triângulo da Vida)
-- ============================================================
INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_arcanoAtual', 'Arcano Atual 1 — O Mago', 'Você está em um período de grande poder pessoal e capacidade criadora. Tudo o que você foca tende a se materializar. A energia disponível é para iniciar, transformar e dominar sua realidade.'),
(2, 'pessoal_arcanoAtual', 'Arcano Atual 2 — A Sacerdotisa', 'Um período de conhecimento intuitivo e revelações internas. Sua intuição está no auge — confie nela. O que não pode ser visto pelos olhos é percebido pelo coração neste ciclo.'),
(3, 'pessoal_arcanoAtual', 'Arcano Atual 3 — A Imperatriz', 'Um ciclo de abundância, criatividade e florescimento. Novos projetos, relacionamentos e ideias germinam com facilidade. A fertilidade deste período é tanto literal quanto metafórica.'),
(4, 'pessoal_arcanoAtual', 'Arcano Atual 4 — O Imperador', 'Um período de estabelecimento de estruturas e exercício de autoridade. Você está sendo chamado a organizar, decidir e liderar com firmeza. As bases lançadas agora terão longa duração.'),
(5, 'pessoal_arcanoAtual', 'Arcano Atual 5 — O Hierofante', 'Um ciclo de aprendizado, tradição e orientação espiritual. Mestres, ensinamentos e estruturas de conhecimento ganham importância. Busque sabedoria em fontes confiáveis.'),
(6, 'pessoal_arcanoAtual', 'Arcano Atual 6 — Os Amantes', 'Um período de escolhas significativas, especialmente em relacionamentos. Decisões tomadas agora têm impacto duradouro. O amor, em todas as suas formas, está no centro deste ciclo.'),
(7, 'pessoal_arcanoAtual', 'Arcano Atual 7 — O Carro', 'Um ciclo de vitórias alcançadas através da determinação e do foco. Você está avançando — talvez em meio a turbulências — mas a direção é clara. Mantenha as rédeas com firmeza.'),
(8, 'pessoal_arcanoAtual', 'Arcano Atual 8 — A Força', 'Um período que exige coragem interior e domínio das emoções. A verdadeira força vem de dentro. Sua capacidade de lidar com situações intensas sem perder a serenidade é testada e fortalecida.'),
(9, 'pessoal_arcanoAtual', 'Arcano Atual 9 — O Eremita', 'Um ciclo de sabedoria, recolhimento e orientação. Você serve como farol para outros em seu ambiente. Ao mesmo tempo, precisa de períodos de solitude para recarregar sua luz interior.'),
(11, 'pessoal_arcanoAtual', 'Arcano Atual 11 — A Justiça', 'Um período de equilíbrio, causa e efeito. As consequências das suas ações passadas chegam — sejam elas positivas ou desafiadoras. Aja com integridade e confie na imparcialidade do universo.'),
(22, 'pessoal_arcanoAtual', 'Arcano Atual 22 — O Louco', 'Um ciclo de saltos quânticos e fé no processo. Você está sendo convidado a dar um passo ao longo do abismo com confiança. A aparente loucura deste movimento é, na verdade, sabedoria em ação.')
ON CONFLICT (numero, tipo) DO NOTHING;
