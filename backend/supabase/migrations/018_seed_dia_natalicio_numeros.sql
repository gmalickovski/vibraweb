-- Migration 018: Seed Textos de Dia Natalício (por número)
-- A migration 012 só criou o texto de DEFINIÇÃO da categoria
-- (estatico_def_dia_natalicio) — nunca populou os 11 textos por número
-- (pessoal_dia_natalicio, 1 a 9, 11 e 22) usados em document-builder.ts
-- (numEntry 'num-dia-natalicio') e na caixa "Dia Natalício" de OutputPanel.tsx.
-- Tom baseado no texto real de Dia Natalício do mapa de exemplo (Emmanuelle,
-- número 6) e no padrão das migrations 008-011.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_dia_natalicio', 'Dia Natalício 1', 'Nasceu com a marca da iniciativa. Desde cedo, revela uma disposição natural para tomar a frente, decidir por conta própria e não esperar que os outros abram o caminho primeiro. É um dom que se manifesta quase sem esforço: a coragem de começar.

Essa vibração se traduz em independência de espírito e em uma resistência natural a seguir ordens sem questionar. Prefere aprender fazendo, testando, arriscando — e costuma se destacar justamente nos momentos em que é preciso alguém disposto a dar o primeiro passo.

É um talento que reforça o número de Destino e o Número Psíquico sempre que eles também pedem liderança, e que, mesmo isolado, já funciona como uma ferramenta extra de autoconfiança disponível desde a infância.'),

(2, 'pessoal_dia_natalicio', 'Dia Natalício 2', 'Nasceu com o dom natural da sensibilidade e da conciliação. Desde cedo, percebe com facilidade o que os outros sentem, muitas vezes antes mesmo que eles próprios saibam nomear. É um talento quase automático para mediar, acalmar e aproximar.

Essa vibração se manifesta em paciência para ouvir, tato para lidar com situações delicadas e uma preferência natural pela cooperação em vez da disputa. Costuma ser a pessoa a quem os outros recorrem quando precisam de um conselho equilibrado.

É um dom que reforça qualquer vocação ligada a relacionamentos, parcerias e trabalho em equipe — um talento tão presente no dia a dia que muitas vezes passa despercebido justamente por parecer "natural demais".'),

(3, 'pessoal_dia_natalicio', 'Dia Natalício 3', 'Nasceu com o dom da expressão. Desde cedo, comunica-se com facilidade, seja pela palavra, pelo humor, pela escrita ou por alguma forma de arte — há uma leveza natural em colocar para fora o que sente e pensa.

Essa vibração se traduz em criatividade espontânea, sociabilidade e uma capacidade quase inata de contagiar os ambientes com entusiasmo e otimismo. Aprende e se expressa melhor quando há espaço para brincar com as ideias, não quando é forçado a seguir fórmulas rígidas.

É um talento que ilumina qualquer área da vida que envolva comunicação, criação ou convívio social — um diferencial que costuma florescer sozinho, sem exigir grande esforço consciente para se manifestar.'),

(4, 'pessoal_dia_natalicio', 'Dia Natalício 4', 'Nasceu com o dom natural da organização. Desde cedo, revela facilidade para estruturar, planejar e sustentar aquilo que assume — onde outros veem caos, já enxerga por onde começar a organizar.

Essa vibração se manifesta como praticidade, senso de responsabilidade precoce e uma resistência natural ao desperdício, seja de tempo, de recursos ou de esforço. É confiável quase por reflexo: cumpre o que promete, mesmo sem ser cobrado.

É um talento que reforça qualquer plano de longo prazo — profissional, financeiro ou pessoal — funcionando como uma base sólida sobre a qual outras conquistas do mapa podem se apoiar com mais segurança.'),

(5, 'pessoal_dia_natalicio', 'Dia Natalício 5', 'Nasceu com o dom natural da adaptação. Desde cedo, lida bem com o imprevisto, se ajusta rápido a novos contextos e sente um chamado quase automático pela variedade — de experiências, de pessoas, de caminhos.

Essa vibração se traduz em curiosidade ativa, magnetismo pessoal e uma versatilidade que permite transitar por ambientes diferentes com desenvoltura. Rotinas rígidas tendem a lhe pesar mais do que a maioria das pessoas, mas em compensação floresce diante da mudança.

É um talento que se destaca em qualquer contexto que exija jogo de cintura, comunicação e capacidade de se reinventar — um diferencial natural que costuma ser confundido com simples inquietação, quando na verdade é uma inteligência adaptativa.'),

(6, 'pessoal_dia_natalicio', 'Dia Natalício 6', 'A sua natureza essencial é emotiva e prima pelo bem-estar, pelo conforto e pela cordialidade. O interesse genuíno pelo bem-estar dos outros é um dom que se manifesta desde cedo, ainda que, ocasionalmente, gere um esforço maior do que o necessário para agradar ou cuidar.

Possui um desenvolvido senso de humanidade e amor pela vida, além de um magnetismo natural que facilita a convivência social. Tende a idealizar pessoas e situações, o que pode gerar expectativas altas — mas também é o que move a busca constante por harmonia ao redor de si.

Esse talento se projeta com força na personalidade, especialmente quando os números de Motivação, Impressão e Expressão também caminham na direção do cuidado e da conexão — reforçando uma vocação natural para acolher e harmonizar.'),

(7, 'pessoal_dia_natalicio', 'Dia Natalício 7', 'Nasceu com o dom natural da introspecção. Desde cedo, sente-se atraído por entender o "porquê" das coisas, prefere qualidade a quantidade nas relações e encontra energia no silêncio e na reflexão, não na agitação constante.

Essa vibração se manifesta como perspicácia analítica, intuição aguçada e uma seletividade natural — não se entrega a qualquer relação ou compromisso, precisa primeiro compreender. Pode ser vista como reservada, mas essa reserva é, na verdade, um espaço de observação profunda.

É um talento que favorece qualquer caminho ligado ao estudo, à pesquisa ou à busca espiritual — um diferencial silencioso, que amadurece com o tempo e recompensa quem tem paciência para cultivá-lo.'),

(8, 'pessoal_dia_natalicio', 'Dia Natalício 8', 'Nasceu com o dom natural da gestão. Desde cedo, revela senso prático para lidar com recursos, decisões e responsabilidades de peso — onde outros hesitam diante de uma escolha difícil, já demonstra disposição para assumir o comando.

Essa vibração se traduz em ambição saudável, visão de longo prazo e uma capacidade natural de organizar pessoas e processos em torno de um objetivo. Costuma amadurecer cedo em relação a dinheiro e responsabilidade, e não teme o trabalho árduo quando o resultado vale a pena.

É um talento que reforça qualquer vocação ligada a liderança, negócios ou administração — uma ferramenta poderosa desde que equilibrada com ética, já que o mesmo impulso que constrói pode, em excesso, tornar-se autoritário.'),

(9, 'pessoal_dia_natalicio', 'Dia Natalício 9', 'Nasceu com o dom natural da generosidade. Desde cedo, sente-se tocado pelas causas maiores do que si mesmo, e há uma facilidade genuína em compreender e acolher pessoas de contextos muito diferentes do seu.

Essa vibração se manifesta como idealismo, sensibilidade humanitária e uma visão de mundo mais ampla do que a média — muitas vezes já na infância demonstra preocupação com questões que a maioria só passa a notar na vida adulta. Também carrega um certo desapego natural ao acumular.

É um talento que ilumina qualquer trajetória voltada ao serviço, à arte ou à causas coletivas — um diferencial que pede, ao mesmo tempo, aprender a cuidar de si com a mesma generosidade que dedica aos outros.'),

(11, 'pessoal_dia_natalicio', 'Dia Natalício 11', 'Nasceu sob a marca de um número mestre: a intuição amplificada. Desde cedo, percebe nuances, energias e possibilidades que passam despercebidas para a maioria — um dom sutil, que exige mais maturidade para ser bem canalizado.

Essa vibração se traduz em sensibilidade extrema, idealismo inspirador e uma capacidade natural de influenciar pelo exemplo mais do que pela imposição. Pode oscilar entre momentos de grande clareza e fases de insegurança, já que a intensidade do 11 nem sempre encontra espaço fácil de expressão no mundo prático.

É um talento poderoso quando bem trabalhado — funciona como uma antena voltada para o que ainda não é visível aos outros, reforçando qualquer vocação ligada à inspiração, à liderança espiritual ou à criação de algo verdadeiramente original.'),

(22, 'pessoal_dia_natalicio', 'Dia Natalício 22', 'Nasceu sob a marca do número mestre da grande construção. Desde cedo, revela uma capacidade rara de unir visão ampla com senso prático — sonha grande, mas também sabe, instintivamente, os passos concretos para tirar a ideia do papel.

Essa vibração se manifesta como ambição de impacto duradouro: não basta realizar algo para si, há um chamado natural para deixar um legado que beneficie muitos. Carrega também uma responsabilidade que pode pesar cedo, exigindo equilíbrio entre o sonho grandioso e os limites reais de cada etapa.

É o mais poderoso dos dons natos quando bem canalizado — reforça qualquer projeto de grande escala no mapa, funcionando como o alicerce que transforma potencial em construção concreta e duradoura.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
