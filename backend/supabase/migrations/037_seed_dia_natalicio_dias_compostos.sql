-- 037_seed_dia_natalicio_dias_compostos.sql
-- Dia Natalício cobre TODOS os dias do mês (1-31), não só 1-9/11/22: o número
-- do mapa é o dia CRU de nascimento (calcDiaNatalicio em numerology.ts).
-- Faltavam os 20 dias compostos (10, 12-21, 23-31) — quem nascia num deles
-- ficava sem texto no documento. Estilo segue os 11 textos já existentes
-- ("Nasceu com o dom natural de...", 3 parágrafos, tom direto ao cliente).
-- Cada dia composto menciona a vibração reduzida + a nuance dos dígitos que
-- o compõem (numerologia caldaica); 13/14/16/19 citam a lição kármica do dia.
-- A UI de edição vive em Textos → Débitos, Dias e Bloqueios (grade Dia 1-31),
-- junto de Débitos Cármicos e Dias Favoráveis.

INSERT INTO interpretacoes (numero, tipo, titulo, texto) VALUES
(10, 'pessoal_dia_natalicio', 'Dia Natalício 10', 'Nasceu com o dom natural da liderança renovadora. O 10 carrega a força pioneira do 1 amplificada pelo 0, que funciona como um espelho: tudo o que inicia tende a ganhar alcance e visibilidade maiores do que o esperado.

Essa vibração se manifesta em coragem para recomeçar, magnetismo pessoal e uma capacidade rara de transformar quedas em novos ciclos. Ganhos e reviravoltas fazem parte do seu caminho — e é justamente na reinvenção que o seu talento aparece.

O convite deste dia é usar a independência com propósito: liderar sem atropelar, começar sem abandonar no meio, e lembrar que cada novo ciclo iniciado com integridade multiplica os frutos do anterior.'),
(12, 'pessoal_dia_natalicio', 'Dia Natalício 12', 'Nasceu com o dom natural da expressão inteligente. O 12 une a iniciativa do 1 à sensibilidade do 2 e vibra no 3: comunicação criativa, charme e uma mente que aprende observando os dois lados de qualquer situação.

Essa vibração se manifesta em facilidade para falar, escrever, ensinar e encantar — muitas vezes convocado a dar voz ao que o grupo sente e não consegue formular.

O convite deste dia é não dispersar o talento em mil interesses: escolher poucos canais de expressão e aprofundá-los, transformando a versatilidade em obra concreta em vez de promessa constante.'),
(13, 'pessoal_dia_natalicio', 'Dia Natalício 13', 'Nasceu com o dom da construção transformadora — e com uma lição kármica embutida. O 13 reduz ao 4: trabalho, estrutura e disciplina; mas o 1 e o 3 pedem que essa solidez seja criativa, nunca rígida.

Essa vibração se manifesta em enorme capacidade de realizar através do esforço bem dirigido. O que vem fácil tende a se desfazer; o que é construído com método permanece e se multiplica.

O convite deste dia é abraçar o trabalho como caminho de transformação, sem atalhos: cada estrutura erguida com paciência vira base para uma liberdade que os atalhos jamais entregariam.'),
(14, 'pessoal_dia_natalicio', 'Dia Natalício 14', 'Nasceu com o dom do movimento — e com uma lição kármica sobre a medida. O 14 reduz ao 5: liberdade, versatilidade e magnetismo; o 1 e o 4 pedem que essa energia inquieta ganhe direção e constância.

Essa vibração se manifesta em adaptabilidade fora do comum, talento para comunicação e negócios, e uma vida marcada por mudanças que renovam tudo ao redor.

O convite deste dia é dominar os próprios impulsos: excessos — de prazeres, riscos ou promessas — cobram caro. A liberdade madura, exercida com moderação, transforma a instabilidade em versatilidade brilhante.'),
(15, 'pessoal_dia_natalicio', 'Dia Natalício 15', 'Nasceu com o dom natural do acolhimento magnético. O 15 une a iniciativa do 1 à versatilidade do 5 e vibra no 6: afeto, harmonia e uma presença que atrai e conforta as pessoas quase sem esforço.

Essa vibração se manifesta em senso estético apurado, talento para cuidar — da família, do lar, de projetos e de pessoas — e uma habilidade especial de unir responsabilidade com charme.

O convite deste dia é amar sem aprisionar: servir e cuidar por escolha, não por obrigação ou controle. Quando o afeto flui livre, este dia natalício se torna um dos mais generosos e queridos do mês.'),
(16, 'pessoal_dia_natalicio', 'Dia Natalício 16', 'Nasceu com o dom da visão profunda — e com uma lição kármica sobre o desapego. O 16 reduz ao 7: análise, intuição e busca de sentido; o 1 e o 6 falam de orgulho e afetos que precisam ser vividos com humildade.

Essa vibração se manifesta em inteligência investigativa, interesse pelo invisível e uma sabedoria que cresce a cada reconstrução — pois este dia costuma derrubar o que foi erguido sobre bases falsas.

O convite deste dia é construir sobre o essencial: verdade, estudo e vida interior. O que é autêntico permanece de pé, e cada recomeço revela um nível mais alto de consciência.'),
(17, 'pessoal_dia_natalicio', 'Dia Natalício 17', 'Nasceu com o dom natural da realização duradoura. O 17 une a iniciativa do 1 à sabedoria do 7 e vibra no 8: ambição construtiva, visão de longo prazo e capacidade de deixar marca no mundo material.

Essa vibração se manifesta em talento para liderar grandes projetos, intuição afiada para negócios e uma resiliência que transforma provações em degraus.

O convite deste dia é unir prosperidade e propósito: conquistas erguidas apenas por status pesam; as erguidas com significado sustentam o seu nome por muito tempo — este é um dia natalício de legado.'),
(18, 'pessoal_dia_natalicio', 'Dia Natalício 18', 'Nasceu com o dom natural da consciência ampla. O 18 une a iniciativa do 1 ao poder realizador do 8 e vibra no 9: humanitarismo, visão de conjunto e um coração que se sente responsável por mais gente do que seria obrigado.

Essa vibração se manifesta em generosidade, magnetismo para liderar causas e uma sensibilidade que capta tanto o sofrimento quanto o potencial dos outros.

O convite deste dia é servir sem se anular: doar-se a partir da própria força, encerrando ciclos com maturidade em vez de carregá-los indefinidamente. Quando aprende a concluir, sua vida se torna inspiração.'),
(19, 'pessoal_dia_natalicio', 'Dia Natalício 19', 'Nasceu com o dom da liderança completa — e com uma lição kármica sobre o poder. O 19 contém o início (1) e o fim (9) e reduz ao 1: independência, força criadora e a missão de conquistar o próprio lugar sem se apoiar indevidamente nos outros.

Essa vibração se manifesta em autossuficiência precoce, brilho pessoal e capacidade de recomeçar do zero quantas vezes for preciso.

O convite deste dia é exercer o poder com retidão: usar a força para abrir caminho também para os outros, nunca apenas para si. A liderança generosa dissolve a dívida e revela a grandeza deste dia.'),
(20, 'pessoal_dia_natalicio', 'Dia Natalício 20', 'Nasceu com o dom natural da cooperação sensível. O 20 amplia a vibração do 2 pelo espelho do 0: diplomacia, escuta profunda e uma percepção emocional que capta o clima de qualquer ambiente em segundos.

Essa vibração se manifesta em talento para parcerias, pacificação e trabalho em equipe — a força deste dia age nos bastidores, unindo pessoas e preparando o terreno onde os outros brilham.

O convite deste dia é dar valor à própria contribuição: a suavidade não é fraqueza. Quando aprende a se posicionar sem perder a gentileza, torna-se o elo indispensável de qualquer projeto.'),
(21, 'pessoal_dia_natalicio', 'Dia Natalício 21', 'Nasceu com o dom natural da expressão vitoriosa. O 21 une a sensibilidade do 2 à iniciativa do 1 e vibra no 3: criatividade, sociabilidade e uma alegria contagiante que abre portas onde a força não abriria.

Essa vibração se manifesta em talento artístico ou comunicativo, otimismo e uma rede de amizades que acompanha e impulsiona as suas conquistas.

O convite deste dia é dar forma ao que imagina: concluir o que começa e não depender só do charme. Quando a disciplina se junta ao brilho, este dia natalício colhe reconhecimento público e realizações queridas.'),
(23, 'pessoal_dia_natalicio', 'Dia Natalício 23', 'Nasceu com o dom natural da versatilidade encantadora. O 23 une a diplomacia do 2 à expressão do 3 e vibra no 5: movimento, comunicação e uma facilidade rara de se adaptar a pessoas e situações completamente diferentes.

Essa vibração se manifesta em carisma, rapidez mental e proteção nos momentos de mudança — este é tradicionalmente um dos dias mais afortunados para lidar com o público.

O convite deste dia é escolher direções dignas do seu alcance: a mesma soltura que abre todas as portas pode dispersar a energia. Com foco, sua adaptabilidade vira sucesso consistente.'),
(24, 'pessoal_dia_natalicio', 'Dia Natalício 24', 'Nasceu com o dom natural da dedicação afetuosa. O 24 une a sensibilidade do 2 à estrutura do 4 e vibra no 6: família, harmonia e um talento genuíno para construir segurança emocional e material para quem ama.

Essa vibração se manifesta em lealdade, senso de responsabilidade doméstica e habilidade para curar ambientes — onde chega, o clima melhora e as relações se organizam.

O convite deste dia é cuidar sem se sacrificar em excesso: estabelecer limites saudáveis para que o amor dado não vire cobrança. Assim, este dia natalício floresce em relações longas e prósperas.'),
(25, 'pessoal_dia_natalicio', 'Dia Natalício 25', 'Nasceu com o dom natural da intuição analítica. O 25 une a sensibilidade do 2 à liberdade do 5 e vibra no 7: mente investigadora, percepção fina e uma necessidade real de silêncio para se reencontrar.

Essa vibração se manifesta em talento para pesquisa, análise e aconselhamento — as pessoas confiam na profundidade do seu olhar, mesmo quando você fala pouco.

O convite deste dia é equilibrar recolhimento e presença: compartilhar o que descobre em vez de se isolar com as próprias conclusões. Sua sabedoria cresce quando circula.'),
(26, 'pessoal_dia_natalicio', 'Dia Natalício 26', 'Nasceu com o dom natural da gestão generosa. O 26 une a cooperação do 2 ao afeto responsável do 6 e vibra no 8: talento para administrar recursos, pessoas e patrimônios com equilíbrio entre firmeza e cuidado.

Essa vibração se manifesta em senso prático apurado, capacidade de inspirar confiança e uma ambição que naturalmente inclui o bem-estar dos que estão por perto.

O convite deste dia é manter a integridade como bússola nos assuntos materiais: parcerias e finanças conduzidas com transparência multiplicam-se; atalhos cobram juros. Conduzindo com ética, este dia constrói prosperidade sólida e compartilhada.'),
(27, 'pessoal_dia_natalicio', 'Dia Natalício 27', 'Nasceu com o dom natural da compaixão sábia. O 27 une a sensibilidade do 2 à profundidade do 7 e vibra no 9: visão humanitária, intuição elevada e um coração que compreende antes de julgar.

Essa vibração se manifesta em magnetismo discreto, talento para ensinar, curar ou orientar, e uma percepção que enxerga o quadro inteiro onde os outros veem detalhes.

O convite deste dia é confiar na própria luz: assumir o papel de referência que a vida insiste em lhe dar, encerrando ciclos com desapego. Este é um dia natalício de almas que vieram para elevar o ambiente onde vivem.'),
(28, 'pessoal_dia_natalicio', 'Dia Natalício 28', 'Nasceu com o dom natural da liderança afetiva. O 28 une a diplomacia do 2 ao poder do 8 e vibra no 1: iniciativa, ambição e uma rara capacidade de comandar conquistando afeto em vez de impor medo.

Essa vibração se manifesta em determinação, talento para começar empreendimentos e um magnetismo que atrai aliados para os seus projetos.

O convite deste dia é sustentar a independência sem perder as parcerias: dividir o comando quando necessário e proteger o que constrói com contratos e clareza. Assim, a força do 28 se converte em conquistas duradouras.'),
(29, 'pessoal_dia_natalicio', 'Dia Natalício 29', 'Nasceu sob a marca de um número mestre: o 29 reduz ao 11, a intuição amplificada. A sensibilidade do 2 e a consciência do 9 formam uma antena finíssima para emoções, atmosferas e verdades não ditas.

Essa vibração se manifesta em inspiração, idealismo e uma capacidade natural de tocar profundamente as pessoas — muitas vezes sem perceber o próprio impacto.

O convite deste dia é ancorar a sensibilidade: cultivar rotina, corpo e limites emocionais para que a intuição vire orientação segura em vez de oscilação. Amadurecida, esta é uma das vibrações mais inspiradoras do mês.'),
(30, 'pessoal_dia_natalicio', 'Dia Natalício 30', 'Nasceu com o dom natural da expressão plena. O 30 amplia a vibração criativa do 3 pelo espelho do 0: comunicação, arte e uma alegria expansiva que não passa despercebida em lugar nenhum.

Essa vibração se manifesta em talento para palavras, imagens e palco — em qualquer área, o seu diferencial é dar forma bela e acessível ao que pensa e sente.

O convite deste dia é levar o próprio talento a sério: transformar inspiração em ofício, com constância e acabamento. Quando a disciplina encontra a sua criatividade, o reconhecimento deixa de ser questão de sorte.'),
(31, 'pessoal_dia_natalicio', 'Dia Natalício 31', 'Nasceu com o dom natural da criação estruturada. O 31 une a expressão do 3 à iniciativa do 1 e vibra no 4: imaginação a serviço da construção, com disciplina suficiente para transformar boas ideias em realidade concreta.

Essa vibração se manifesta em talento para organizar o criativo — projetos, equipes, métodos — e uma perseverança que conclui o que outros abandonariam na metade.

O convite deste dia é manter a flexibilidade dentro da ordem: estruturar sem enrijecer, sustentar sem se fechar ao novo. Assim, este dia natalício ergue obras que unem beleza e solidez.')
ON CONFLICT (numero, tipo) DO NOTHING;
