-- Migration 025: Seed Arcanos Complementares (79-99)
-- Mesma fonte/lógica da migration 023 — ver seu cabeçalho. Estes 21 arcanos
-- são exclusivos da numerologia cabalística (não existem no tarô de 78
-- cartas) e remetem a outros arcanos por redução numerológica.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(79, 'pessoal_arcano', '79', 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); indica recomeço e triunfo em nova jornada.

Desafio: exige desconstruir o que foi erguido sob bases egoicas para avançar com determinação e humildade.'),

(80, 'pessoal_arcano', '80', 'Remete ao arcano 8 (A Justiça); indica a colheita do poder espiritual e o equilíbrio absoluto de forças.

Desafio: exige agir com retidão estrita e integridade para evitar os efeitos do retorno cármico.'),

(81, 'pessoal_arcano', '81', 'Remete ao arcano 9 (O Eremita); indica a consciência desperta através da introspecção profunda e do amadurecimento.

Desafio: cuidado para não se fechar no isolamento ou na arrogância intelectual.'),

(82, 'pessoal_arcano', '82', 'Remete aos arcanos 10 (A Roda da Fortuna) e 1 (O Mago); indica a diplomacia a serviço do poder e a maestria diante dos ciclos.

Desafio: evitar a manipulação fria e o oportunismo excessivo nas flutuações da vida.'),

(83, 'pessoal_arcano', '83', 'Remete aos arcanos 11 (A Força) e 2 (A Papisa); representa a força criativa inteligente colocada a serviço do progresso de vida.

Desafio: cuidado para não reprimir a sensibilidade e evitar que a pressa gere impaciência.'),

(84, 'pessoal_arcano', '84', 'Remete aos arcanos 12 (O Enforcado) e 3 (A Imperatriz); indica o artífice da política, a capacidade de negociar com inteligência sob pressão.

Desafio: evitar o conformismo excessivo ou agir puramente por autopreservação.'),

(85, 'pessoal_arcano', '85', 'Remete aos arcanos 13 (A Morte) e 4 (O Imperador); indica a transformação profunda conquistada pelo esforço concentrado e doloroso.

Desafio: evitar a rigidez ao lidar com as perdas e o apego excessivo a velhas estruturas desmoronadas.'),

(86, 'pessoal_arcano', '86', 'Remete aos arcanos 14 (A Temperança) e 5 (O Papa); indica o equilíbrio entre a vida material e espiritual e a busca pela verdade.

Desafio: evitar cair no fanatismo doutrinário ou na acomodação morna diante de polaridades.'),

(87, 'pessoal_arcano', '87', 'Remete aos arcanos 15 (O Diabo) e 6 (Os Enamorados); indica a espiritualização do ser através da humanização e da superação das tentações.

Desafio: cuidado para não se deixar enredar pelas armadilhas das paixões materiais egoicas.'),

(88, 'pessoal_arcano', '88', 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); representa o triunfo do poder espiritual sobre as estruturas falsas e a justiça divina.

Desafio: exige humildade absoluta para não sofrer quedas geradas pela soberba ou megalomania.'),

(89, 'pessoal_arcano', '89', 'Remete aos arcanos 17 (A Estrela) e 8 (A Justiça); indica a retidão e o poder exercido com sabedoria prática e esperança.

Desafio: evitar a ingenuidade ou a passividade perante leis de causa e efeito.'),

(90, 'pessoal_arcano', '90', 'Remete ao arcano 9 (O Eremita); indica a amplitude da consciência através da busca solitária e integrada.

Desafio: evitar a solidão amarga e a resistência em compartilhar a luz interior.'),

(91, 'pessoal_arcano', '91', 'Remete aos arcanos 10 (A Roda da Fortuna) e 1 (O Mago); indica o início de um novo ciclo evolutivo e o renascimento espiritual.

Desafio: exige foco e coragem para abraçar a nova jornada sem resíduos do passado.'),

(92, 'pessoal_arcano', '92', 'Remete aos arcanos 11 (A Força) e 2 (A Papisa); indica a sinergia entre o autodomínio inteligente e a intuição profunda para servir ao próximo.

Desafio: evitar o desgaste por timidez ou a falta de ação externa correspondente.'),

(93, 'pessoal_arcano', '93', 'Remete aos arcanos 12 (O Enforcado) e 3 (A Imperatriz); indica a criatividade aliada à sabedoria silenciosa obtida pelo desapego.

Desafio: evitar o desânimo diante de atrasos temporários de manifestação comercial.'),

(94, 'pessoal_arcano', '94', 'Remete aos arcanos 13 (A Morte) e 4 (O Imperador); representa o renascimento estruturado da personalidade perante a sociedade.

Desafio: evitar a resistência nervosa ao fim de rotinas familiares desatualizadas.'),

(95, 'pessoal_arcano', '95', 'Remete aos arcanos 14 (A Temperança) e 5 (O Papa); indica o despertar de um conhecimento superior através do equilíbrio alquímico.

Desafio: cuidado para não isolar a sabedoria em dogmas inflexíveis de comportamento.'),

(96, 'pessoal_arcano', '96', 'Remete aos arcanos 15 (O Diabo) e 6 (Os Enamorados); aponta para o exercício maduro e livre de escolhas conscientes contra os apegos.

Desafio: evitar adiar escolhas vitais de mudança por ilusão ou medo de perdas materiais temporárias.'),

(97, 'pessoal_arcano', '97', 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); representa o triunfo definitivo da espiritualidade sobre o colapso do egoísmo.

Desafio: exige resiliência total e adaptabilidade no processo de destruição de ilusões.'),

(98, 'pessoal_arcano', '98', 'Remete aos arcanos 17 (A Estrela) e 8 (A Justiça); indica a espiritualização das realidades do mundo material por retidão ética.

Desafio: evitar a idealização ingênua que ignora a lei de causa e efeito prática.'),

(99, 'pessoal_arcano', '99', 'Remete aos arcanos 18 (A Lua) e 9 (O Eremita); indica a iluminação máxima da consciência individual que cruzou o inconsciente.

Desafio: evitar as últimas fantasias de autoengano e a melancolia espiritual de fim de ciclo.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
