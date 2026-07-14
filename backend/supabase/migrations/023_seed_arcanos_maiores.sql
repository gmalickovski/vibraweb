-- Migration 023: Seed Arcanos Maiores (1-22)
-- Fonte: nome-magnetico/src/backend/numerology/arcanos.ts (mesmo autor,
-- conteúdo já adaptado/reescrito por ele a partir do material de referência,
-- reaproveitado aqui em vez de retranscrever fresco de PDFs de curso de
-- terceiros). Chave 'pessoal_arcano' — única lista, usada tanto pro Arcano
-- Regente quanto pra Sequência de Arcanos e pro Arcano Atual (são o mesmo
-- número, mesma interpretação, só muda o contexto de onde aparece no mapa).

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'pessoal_arcano', '1 — O Mago', 'Aponta para os potenciais criativos a serem manifestados; momento de identificar as oportunidades inexploradas e começar a nova jornada. É preciso ser um em si mesmo e unido ao mundo espiritual, para que haja experiência espiritual reveladora. A intuição será seu guia nesse sentido. O Mago instiga para se iniciar o processo da autoconsciência, para alcançar a individuação; ele guia para uma viagem pelo mundo interior de nosso EU mais profundo transcendendo o ego superficial.

Desafio: evitar a inatividade ou a arrogância egoica que cega para a orientação espiritual.'),

(2, 'pessoal_arcano', '2 — A Papisa', 'Aponta para a percepção sutil da mente intuitiva guiando o pensamento e a razão. A dualidade proposta por este Arcano se estabelece a partir de dois centros de observação, dois princípios, sendo um ativo e outro passivo. O intelecto representa o princípio feminino da mente, enquanto a imaginação fecundadora é seu princípio masculino. A Papisa governa pela paciência feminina, pelo amor e pela persistência.

Desafio: evitar a passividade fria e o retraimento emocional.'),

(3, 'pessoal_arcano', '3 — A Imperatriz', 'Aponta para a natureza sociável; a magia sagrada que fecunda a criação para gerar abundância. Arte, ciência, magia e mística; o êxito nos empreendimentos pela firmeza de propósito, pela ação da vontade e pela fé. A Imperatriz convida para tomar um novo caminho, o da regeneração, ou da geração do novo na expressão criativa da imaginação.

Desafio: evitar a futilidade, vaidade fútil ou dispersão de energia.'),

(4, 'pessoal_arcano', '4 — O Imperador', 'Aponta para o poder verdadeiro e único da lei. Ser alguma coisa, saber alguma coisa e poder alguma coisa é que tornam uma pessoa dotada de autoridade. Isso não substitui a autoridade divina, mas, pelo contrário, o Imperador resigna-se a ela renunciando ao desejo de autoridade do ego. Reflete a autoridade espiritual na humanização do ser humano; a verdade e a honestidade.

Desafio: evitar o autoritarismo, a tirania e a rigidez mental.'),

(5, 'pessoal_arcano', '5 — O Papa', 'Aponta para uma iniciação em alguma forma de conhecimento superior, que liberta o homem da escravidão da matéria. Estabelece o equilíbrio nos comportamentos diversos através da contenção dos impulsos diversos — emocional, intelectual, físico. O Papa representa a personificação exteriorizada da busca do homem pela conexão com a divindade.

Desafio: evitar o dogmatismo e a intolerância a novas ideias.'),

(6, 'pessoal_arcano', '6 — Os Enamorados', 'Aponta para o livre arbítrio; a escolha que se fizer conduzirá para a evolução consciente, ou para algum desvio ou estagnação. Cada escolha deve ser feita no devido tempo, abstendo-se dos envolvimentos emocionais. É preciso fazer uma escolha — desapegar-se do amor/emoção e prosseguir na senda da consciência, ou permanecer prisioneiro dos desejos e fantasias.

Desafio: evitar a indecisão crônica ou escolhas baseadas puramente em caprichos e desejos do ego.'),

(7, 'pessoal_arcano', '7 — O Carro', 'Aponta para uma nova direção na vida. Essa nova direção pode levar ao triunfo sobre as tentações mundanas, ou à queda na tentação espiritual do vitorioso pela sua própria vitória — a mais sutil e perigosa de todas as tentações, chamada também de ego espiritualidade. O autoconhecimento nos torna conscientes da conexão existente entre a jornada interior e a exterior.

Desafio: para triunfar é preciso humildade; a queda resulta da arrogância e megalomania.'),

(8, 'pessoal_arcano', '8 — A Justiça', 'Aponta para o exercício do livre arbítrio e suas consequências. O homem age pelo seu livre arbítrio, e a lei reage por seus efeitos visíveis e invisíveis, em constante convite ao esforço da consciência. O simbolismo da justiça reflete uma união harmoniosa entre forças opostas equilibradas na neutralidade do julgamento.

Desafio: evitar a hipocrisia, a dureza nos julgamentos e o abuso de autoridade.'),

(9, 'pessoal_arcano', '9 — O Eremita', 'Aponta para o esforço para se iluminar a escuridão do nosso mundo interior ainda obscuro e desconhecido — da escuridão das trevas da ignorância, da passividade e da preguiça; da escuridão do conhecimento superior e do esforço ainda por fazer. Envolve a experiência de aceitar o caminho solitário da individuação, de nos tornarmos um só eu pelo autoconhecimento.

Desafio: evitar o isolamento depressivo, a passividade e a arrogância espiritual.'),

(10, 'pessoal_arcano', '10 — A Roda da Fortuna', 'Aponta para a ascensão e queda na roda das sucessivas reencarnações. Um aspecto nosso aspira a ascensão pela evolução; o outro tende a perpetuar-se prisioneiro das armadilhas do mundo sensorial. Adverte para a necessidade de se libertar do controle automático da natureza animal, para aceitar os paradoxos da vida.

Desafio: evitar a passividade diante dos ciclos e a dependência dos instintos animais inferiores.'),

(11, 'pessoal_arcano', '11 — A Força', 'Aponta para o domínio de nossa natureza inferior instintiva, por ação de nossa natureza superior inteligente. Deixar o plano da quantidade e nos elevarmos ao plano da qualidade — sair do plano do ter e entrar no plano do ser. Equivale a uma transformação das forças mentais e psíquicas e ao amadurecimento emocional. Expõe uma ação de coragem e fé.

Desafio: suavizar o tom da agressividade dando atenção aos aspectos de natureza bruta, para educá-los ao serviço da evolução.'),

(12, 'pessoal_arcano', '12 — O Enforcado', 'Aponta para a resignação ao plano da lei maior. A força da gravitação se inverte impelindo o homem para a vida espiritual. A gravitação terrestre atrai para o poder, a posse, a tirania, o egoísmo; a gravitação espiritual atrai para o desapego, a resignação, a renúncia ao mundo.

Desafio: a força do destino, poderosa, pode a qualquer momento entrar em ação como um chamamento à iniciação espiritual.'),

(13, 'pessoal_arcano', '13 — A Morte', 'Aponta para o processo constante de morte e renascimento que a vida nos propõe, no sentido metafísico e no sentido real, transformando a consciência para o seu despertar psíquico. Nos lembra que todos os dias nós morremos um pouco e renascemos.

Desafio: adverte para o sono psíquico da consciência adormecida nas ilusões da materialidade; propõe o renascimento para uma vida mais espiritualizada.'),

(14, 'pessoal_arcano', '14 — A Temperança', 'Aponta para a ordem do pensamento relativo à polaridade e às possibilidades que ela propicia para o conhecimento e a realização espirituais. As energias criativas da vida seguem o fluxo determinante da vida para as finalidades às quais se destinam em nossa evolução. Propõe fluidez e adaptabilidade às novas condições da vida.

Desafio: o fluir da consciência entre os dois polos da vida — o espiritual e o material; entre o eu superior e o ego consciente.'),

(15, 'pessoal_arcano', '15 — O Diabo', 'Aponta para os segredos do fogo das paixões e da embriaguez do ego no caminho da espiritualização. Sem liberdade para escolher não pode haver moral verdadeira, no entanto, nenhuma escolha deve ser feita por impulso dos desejos do ego ou das paixões escaldantes da sensualidade. É a sombra por detrás da luz.

Desafio: o perigo da rebelião do ego que deseja sobrepor-se às leis divinas — a egolatria ou ego espiritualidade.'),

(16, 'pessoal_arcano', '16 — A Torre', 'Aponta para o mal que tem sua origem na alma do homem enraizado no egoísmo. Inteligência que se desenvolve sem moral, sem ética, induz a alma a pender para o mal e leva o homem à queda. O homem egoísta atrairá sua própria queda a fim de que aprenda a ser humilde.

Desafio: os riscos implicados na aplicação das ciências e filosofias para a construção de "Torres de Babel" — "não devemos construir; devemos crescer".'),

(17, 'pessoal_arcano', '17 — A Estrela', 'Aponta para o exercício, ativo e contemplativo, consagrado ao crescimento espiritual — alma em corpo. Convida para o esforço de aliar a justiça contemplativa com a justiça ativa; unir o princípio do entendimento ao da vontade para irradiar a primeira luz da consciência desperta. Retrata uma vida harmoniosa.

Desafio: observar que existe uma relação entre o curso dos acontecimentos terrestres com os corpos celestes.'),

(18, 'pessoal_arcano', '18 — A Lua', 'Aponta para um exercício espiritual, uma meditação sobre quais elementos internos da psique estão embaralhando o movimento evolutivo com tendência a reverter sua direção. Descer nas profundezas do psiquismo significa ser privado da orientação da luz diurna — para alguns é a noite escura da alma.

Desafio: o caminho está claramente à nossa frente; a escuridão é apenas ausência de luz.'),

(19, 'pessoal_arcano', '19 — O Sol', 'Aponta para a união da inteligência e da sabedoria espontânea — é o arcano da intuição. É nova infância ensolarada, onde a vida já não é um desafio que precisa ser vencido, mas uma experiência para ser desfrutada. Retrata a recuperação da inocência.

Desafio: recuperar a harmonia interior que sentíamos quando crianças, antes que os opostos nos partissem em pedaços.'),

(20, 'pessoal_arcano', '20 — O Julgamento', 'Aponta para um chamamento ao exercício espiritual da iluminação, no qual torna-se necessário o emprego máximo da intuição. Sugere o chamado final para uma passagem para a vida espiritual através do julgamento que a consciência experimenta ao se deparar com uma amplitude maior de percepções.

Desafio: haverá sucessivos julgamentos e sucessivos renascimentos antes de se alcançar a vitória final.'),

(21, 'pessoal_arcano', '21 — O Mundo', 'Aponta para o impulso criativo do coração e da vida, que se vislumbra aos que alcançaram o portal do seu mundo interior. No entrelaçamento de todas as consciências, coisas e criaturas se revela um só Mundo. Aquele que busca pelo seu reino interior encontrará todo o resto por acréscimo.

Desafio: cada ser humano deve encontrar a sua própria chave para a geometria da vida.'),

(22, 'pessoal_arcano', '22 — O Louco', 'Aponta para os potenciais da nossa natureza espiritual, possíveis de serem realizados, pois o arcano do Louco tanto pode ser o 0 (zero) como o 22. É a união dos opostos, da intelectualidade discursiva e da espiritualidade iluminadora — a união da sabedoria humana com a sabedoria divina.

Desafio: a sabedoria do mundo só leva a ser um tolo; assumir a condição de ser espiritual se desidentificando da personalidade temporária.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
