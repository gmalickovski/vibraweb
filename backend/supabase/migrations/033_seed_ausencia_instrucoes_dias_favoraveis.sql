-- Migration 033: três famílias de textos novas em `interpretacoes`:
--
-- 1. Textos de AUSÊNCIA (estatico_sem_debitos / estatico_sem_bloqueios,
--    numero=1) — exibidos no documento quando o mapa não tem Débitos
--    Cármicos ou não tem Bloqueios no Triângulo (casos possíveis). Editáveis
--    em Textos → "Débitos, Dias e Bloqueios".
--
-- 2. Textos de INSTRUÇÃO de cálculo (estatico_instrucao_*, numero=1) —
--    ensinam o cliente a calcular Ano/Mês/Dia Pessoal de qualquer data,
--    mapeados do documento de referência NumWeb ("Para calcular o Ano
--    Pessoal...", etc). Nova aba "Instruções" em Textos; renderizados no
--    documento com o destaque visual próprio (InstructionCallout).
--
-- 3. DIAS FAVORÁVEIS (pessoal_dia_favoravel, numero = o dia do mês, 1-31) —
--    um texto por dia segundo a vibração cabalística do dia reduzido
--    (10→1, 12→3... 11/22/29 preservam os mestres 11/22/11). O cálculo dos
--    dias favoráveis de cada pessoa (calcDiasFavoraveis, numerology.ts) já
--    confere com o documento de referência; estes textos descrevem a
--    vibração de cada dia exibido.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
-- ── 1. Ausência ──────────────────────────────────────────────────────────
(1, 'estatico_sem_debitos', 'Quando não há Débitos Cármicos', 'O seu mapa não apresenta Débitos Cármicos. Nenhum dos números 13, 14, 16 ou 19 aparece nos cálculos centrais (dia de nascimento, Destino, Motivação ou Expressão), o que indica que esta existência não carrega provas cármicas específicas dessa natureza a serem resgatadas. Isso não significa ausência de desafios — os aprendizados seguem indicados pelas Lições Cármicas, pelos Desafios e pelos ciclos do seu mapa —, mas sim que não há um padrão de débito do passado exigindo reequilíbrio prioritário nesta vida.'),

(1, 'estatico_sem_bloqueios', 'Quando não há Bloqueios no Triângulo', 'Não foram encontradas sequências de bloqueio no Triângulo da Vida do seu nome. Nenhuma linha da pirâmide apresenta três ou mais números iguais em sequência, o que indica um fluxo vibracional livre de barreiras crônicas nas áreas representadas por essas combinações. As energias do seu nome circulam sem os obstáculos típicos dos bloqueios, e os pontos de atenção da sua jornada ficam indicados pelos demais elementos do mapa, como os Desafios e as Lições Cármicas.'),

-- ── 2. Instruções de cálculo ─────────────────────────────────────────────
(1, 'estatico_instrucao_ano_pessoal', 'Como calcular o Ano Pessoal', 'Para calcular o Ano Pessoal, some dia, mês e ano da data do último aniversário e reduza a um só algarismo.

Exemplo: aniversário em 23/12/2015 → 2+3+1+2+2+0+1+5 = 16 → 1+6 = 7 — Ano Pessoal 7.

O Ano Pessoal começa no dia do aniversário e termina na véspera do próximo; acabando um ciclo de nove anos, inicia-se outro sucessivamente.'),

(1, 'estatico_instrucao_mes_pessoal', 'Como calcular o Mês Pessoal', 'Para calcular o Mês Pessoal, some o Ano Pessoal com o mês atual e reduza a um único número de 1 a 9 — podendo ser considerados também os números 11 e 22.

Exemplo: Ano Pessoal 7 + mês 5 (maio) → 7+5 = 12 → 1+2 = 3 — maio será o Mês Pessoal 3.'),

(1, 'estatico_instrucao_dia_pessoal', 'Como calcular o Dia Pessoal', 'Para calcular o Dia Pessoal, some o Mês Pessoal com o dia do calendário e reduza a um único número de 1 a 9 — podendo ser considerados também os números 11 e 22.

Exemplo 1: Mês Pessoal 5 + dia 15 → 5+1+5 = 11 — Dia Pessoal 11.
Exemplo 2: Mês Pessoal 9 + dia 15 → 9+1+5 = 15 → 1+5 = 6 — Dia Pessoal 6.'),

-- ── 3. Dias Favoráveis (1-31) ────────────────────────────────────────────
(1,  'pessoal_dia_favoravel', 'Dia 1',  'Dia que vibra com o número 1 — energia de início. Favorável para lançar projetos, tomar decisões importantes, assumir a liderança e dar o primeiro passo naquilo que vinha sendo adiado.'),
(2,  'pessoal_dia_favoravel', 'Dia 2',  'Dia que vibra com o número 2 — energia de cooperação. Favorável para parcerias, conversas delicadas, mediações e trabalho em equipe. Ouça mais do que fala e cultive a paciência.'),
(3,  'pessoal_dia_favoravel', 'Dia 3',  'Dia que vibra com o número 3 — energia de expressão. Favorável para comunicação, apresentações, reuniões criativas, vida social e tudo o que envolve palavra e imagem.'),
(4,  'pessoal_dia_favoravel', 'Dia 4',  'Dia que vibra com o número 4 — energia de estrutura. Favorável para organizar, planejar, firmar contratos de longo prazo e cuidar de assuntos práticos e financeiros com método.'),
(5,  'pessoal_dia_favoravel', 'Dia 5',  'Dia que vibra com o número 5 — energia de movimento. Favorável para mudanças, viagens, vendas, novos contatos e adaptações rápidas; use a liberdade com responsabilidade.'),
(6,  'pessoal_dia_favoravel', 'Dia 6',  'Dia que vibra com o número 6 — energia de harmonia. Favorável para assuntos de família, acordos, compromissos afetivos, questões domésticas e cuidados com a saúde e o bem-estar.'),
(7,  'pessoal_dia_favoravel', 'Dia 7',  'Dia que vibra com o número 7 — energia de análise. Favorável para estudar, pesquisar, planejar em silêncio e avaliar propostas com profundidade antes de decidir.'),
(8,  'pessoal_dia_favoravel', 'Dia 8',  'Dia que vibra com o número 8 — energia de realização material. Favorável para negócios, transações financeiras, cobranças, investimentos e decisões que envolvem poder e justiça.'),
(9,  'pessoal_dia_favoravel', 'Dia 9',  'Dia que vibra com o número 9 — energia de conclusão. Favorável para encerrar ciclos, finalizar pendências, praticar o desapego e dedicar-se a causas maiores que você.'),
(10, 'pessoal_dia_favoravel', 'Dia 10', 'Reduz ao número 1 (1+0) — recomeços com a experiência de um ciclo já percorrido. Favorável para reiniciar planos, retomar conversas e agir com independência.'),
(11, 'pessoal_dia_favoravel', 'Dia 11', 'Dia que vibra com o número mestre 11 — intuição elevada. Favorável para insights, inspiração, assuntos espirituais e ideias visionárias; confie nos sinais sutis, mas mantenha os pés no chão.'),
(12, 'pessoal_dia_favoravel', 'Dia 12', 'Reduz ao número 3 (1+2) — criatividade com iniciativa. Favorável para divulgar ideias, assinar materiais de comunicação e expandir contatos sociais e profissionais.'),
(13, 'pessoal_dia_favoravel', 'Dia 13', 'Reduz ao número 4 (1+3) — trabalho e transformação. Favorável para reorganizar rotinas, resolver pendências acumuladas e construir bases com disciplina; evite atalhos.'),
(14, 'pessoal_dia_favoravel', 'Dia 14', 'Reduz ao número 5 (1+4) — mudança com base sólida. Favorável para renegociar acordos, ajustar rumos e experimentar caminhos novos sem abandonar o que sustenta você.'),
(15, 'pessoal_dia_favoravel', 'Dia 15', 'Reduz ao número 6 (1+5) — responsabilidade afetiva. Favorável para reuniões familiares, decisões sobre o lar e acertos que pedem senso de justiça e acolhimento.'),
(16, 'pessoal_dia_favoravel', 'Dia 16', 'Reduz ao número 7 (1+6) — introspecção reveladora. Favorável para revisões minuciosas, diagnósticos e conversas francas consigo mesmo; adie decisões impulsivas.'),
(17, 'pessoal_dia_favoravel', 'Dia 17', 'Reduz ao número 8 (1+7) — ambição com estratégia. Favorável para negociações de alto nível, assinatura de contratos importantes e movimentos de carreira bem calculados.'),
(18, 'pessoal_dia_favoravel', 'Dia 18', 'Reduz ao número 9 (1+8) — finalização com autoridade. Favorável para concluir projetos, formalizar encerramentos e transformar experiências acumuladas em sabedoria.'),
(19, 'pessoal_dia_favoravel', 'Dia 19', 'Reduz ao número 1 (1+9 = 10 → 1) — iniciativa amadurecida. Favorável para decisões que exigem coragem e para se posicionar com autoridade e clareza.'),
(20, 'pessoal_dia_favoravel', 'Dia 20', 'Reduz ao número 2 (2+0) — sensibilidade e diplomacia ampliadas. Favorável para reconciliações, alianças e decisões que dependem do consentimento de outras pessoas.'),
(21, 'pessoal_dia_favoravel', 'Dia 21', 'Reduz ao número 3 (2+1) — expressão em parceria. Favorável para eventos, celebrações, apresentações em conjunto e conversas que aproximam pessoas.'),
(22, 'pessoal_dia_favoravel', 'Dia 22', 'Dia que vibra com o número mestre 22 — o construtor. Favorável para dar forma concreta a grandes planos, firmar compromissos de longo alcance e realizar com praticidade o que antes era só ideia.'),
(23, 'pessoal_dia_favoravel', 'Dia 23', 'Reduz ao número 5 (2+3) — versatilidade sociável. Favorável para networking, viagens curtas, entrevistas e oportunidades que surgem de conversas inesperadas.'),
(24, 'pessoal_dia_favoravel', 'Dia 24', 'Reduz ao número 6 (2+4) — harmonia construída. Favorável para firmar compromissos duradouros, celebrar uniões e equilibrar as responsabilidades entre vida pessoal e trabalho.'),
(25, 'pessoal_dia_favoravel', 'Dia 25', 'Reduz ao número 7 (2+5) — intuição analítica. Favorável para aprofundar conhecimentos, buscar orientação especializada e refinar estratégias em andamento.'),
(26, 'pessoal_dia_favoravel', 'Dia 26', 'Reduz ao número 8 (2+6) — prosperidade compartilhada. Favorável para sociedades, acordos financeiros em conjunto e decisões patrimoniais que beneficiam o grupo.'),
(27, 'pessoal_dia_favoravel', 'Dia 27', 'Reduz ao número 9 (2+7) — compaixão e síntese. Favorável para perdoar, doar, concluir estudos e fechar acordos com generosidade e visão humanitária.'),
(28, 'pessoal_dia_favoravel', 'Dia 28', 'Reduz ao número 1 (2+8 = 10 → 1) — iniciativa com senso de cooperação. Favorável para liderar acordos, abrir negociações e começar empreendimentos em parceria.'),
(29, 'pessoal_dia_favoravel', 'Dia 29', 'Reduz ao número mestre 11 (2+9 = 11) — sensibilidade ampliada. Favorável para revelações, reconciliações profundas e projetos que unem inspiração e propósito coletivo.'),
(30, 'pessoal_dia_favoravel', 'Dia 30', 'Reduz ao número 3 (3+0) — expressão em sua vibração mais pura. Favorável para atividades artísticas, lançamentos criativos e encontros que pedem leveza e otimismo.'),
(31, 'pessoal_dia_favoravel', 'Dia 31', 'Reduz ao número 4 (3+1) — praticidade criativa. Favorável para concluir a organização do mês, revisar orçamentos e consolidar aquilo que já foi construído.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
