-- Migration 032: Seed dos textos de Bloqueio (Sequências Numéricas) do
-- Triângulo da Vida — tipo 'pessoal_bloqueio', numero = a própria sequência
-- (111-999). Antes esses textos viviam hardcoded em BLOQUEIOS_MAP
-- (numerology.ts) e não eram editáveis; agora o documento busca primeiro no
-- banco (editável em Textos → aba "Débitos, Dias e Bloqueios") e só usa o
-- mapa embutido como fallback. A formatação (itálico do aspecto de saúde)
-- vem dos marcadores markdown no próprio texto — o editor é a fonte da
-- verdade da formatação, o template não força mais estilo.

-- O check original limitava numero a 0-99 (grade padrão + arcanos); as
-- sequências de bloqueio usam o próprio código (111-999) como numero.
ALTER TABLE public.interpretacoes DROP CONSTRAINT interpretacoes_numero_check;
ALTER TABLE public.interpretacoes ADD CONSTRAINT interpretacoes_numero_check CHECK (numero >= 0 AND numero <= 999);

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(111, 'pessoal_bloqueio', 'Bloqueio de Iniciação (111)', 'Limitação profunda da força de vontade, perda de coragem e inatividade crônica. A presença deste bloqueio gera uma forte tendência à dependência de terceiros e cria bloqueios sistêmicos ao tentar iniciar projetos, defender ideias próprias ou afirmar a sua individualidade autêntica. O grande antídoto cármico para transcender essa energia é desenvolver ativamente a coragem, fortalecer a autonomia pessoal e recuperar a confiança absoluta no próprio potencial de liderança inato.

*Aspecto de saúde: tendência para desenvolver alguns distúrbios ou doenças cardíacas.*'),

(222, 'pessoal_bloqueio', 'Bloqueio de Associação (222)', 'Timidez extrema, indecisão constante e uma perigosa tendência a ser subjugado e apagado pelos outros. Este bloqueio manifesta dificuldades severas em manter parcerias, sociedades e relacionamentos saudáveis, muitas vezes resultando em drástica perda de autoestima e anulação da própria vontade. O antídoto fundamental é cultivar a diplomacia, a paciência e estabelecer limites claros para manter o equilíbrio inegociável entre o que você oferece e o que você recebe.

*Aspecto de saúde: pode, eventualmente, surgir alguma doença que provoque dependência.*'),

(333, 'pessoal_bloqueio', 'Bloqueio de Expressão (333)', 'Dificuldade profunda no diálogo e barreiras persistentes ao tentar se comunicar com clareza. Este bloqueio gera a constante sensação de ser incompreendido e uma forte dificuldade em se impor e expressar seus sentimentos verdadeiros nas relações pessoais e profissionais. Para transcender esse obstáculo, o antídoto exige focar na expressão criativa, treinar a comunicação autêntica e transparente, e sustentar o otimismo mesmo diante das barreiras sociais.

*Aspecto de saúde: indica possibilidade de doenças respiratórias ou de articulações.*'),

(444, 'pessoal_bloqueio', 'Bloqueio de Estruturação (444)', 'Bloqueio severo na realização profissional e financeira. Indica uma forte tendência a não receber o reconhecimento merecido pelo seu esforço, além de dificuldade crônica em manter estabilidade. Pode gerar excesso de rigidez, pessimismo ou, pelo contrário, extrema desorganização. O antídoto para destravar este fluxo exige o cultivo diário da disciplina, estabelecimento de métodos claros de ação, e uma resiliência inabalável para construir bases sólidas.

*Aspecto de saúde: indica possibilidade de doenças reumáticas ou arteriais.*'),

(555, 'pessoal_bloqueio', 'Bloqueio de Liberdade (555)', 'Indica eventuais mudanças não planejadas — de residência, cidade, profissão ou meio social — consequentes da instabilidade emocional e da impulsividade decorrente da atitude fraca. Reflete-se, ainda, em fuga do meio social, mau uso da liberdade e dificuldade para encontrar e escolher as melhores oportunidades. O antídoto é desenvolver um processo de amadurecimento emocional pelo autoconhecimento: contenção dos impulsos, pensar antes de agir e controlar gastos mantendo-os dentro do orçamento. A estabilidade emocional e a contenção dos impulsos instintivos passam pelo desenvolvimento do senso da razão.

*Aspecto de saúde: possibilidade de desenvolver alguma doença de pele.*'),

(666, 'pessoal_bloqueio', 'Bloqueio de Harmonia (666)', 'Conflitos persistentes e instabilidade na vida familiar e afetiva. Este bloqueio gera decepções frequentes nos relacionamentos íntimos, ciúmes, possessividade e uma tendência ao isolamento emocional. Muitas vezes, você atrai parceiros incompatíveis ou se sente sobrecarregado por responsabilidades domésticas. O antídoto essencial é desenvolver o amor-próprio antes de buscar afeto externo, aprender a perdoar e cultivar a compreensão de que as relações devem ser fontes de equilíbrio, não de peso.

*Aspecto de saúde: algum tipo de doença cardíaca pode aparecer nesse estado.*'),

(777, 'pessoal_bloqueio', 'Bloqueio de Conexão Espiritual (777)', 'Desconexão dolorosa do plano espiritual e do propósito maior de vida. Este bloqueio gera desânimo, melancolia, confusão mental frequente, medos infundados e uma sensação de vazio interno que o sucesso material não preenche. A energia fica dispersa e a mente nebulosa. O antídoto fundamental para esta vibração é a interiorização diária, o estudo profundo de temas existenciais, a meditação e o desenvolvimento ativo da sua intuição e sabedoria oculta.

*Aspecto de saúde: doenças nervosas, dependências e, eventualmente, algum tipo de câncer.*'),

(888, 'pessoal_bloqueio', 'Bloqueio de Poder e Abundância (888)', 'Indica possíveis dificuldades decorrentes das instabilidades emocionais, procedendo no afastamento das atividades profissionais e sociais com reflexos negativos na situação financeira. Acarreta oscilações entre abundância, carência e descontrole emocional. O antídoto é desenvolver o senso da razão e da justiça; assumir responsabilidades e ser ético; compreender que as dificuldades financeiras geralmente decorrem de instabilidades emocionais, da incapacidade de lidar com o próprio poder interior e da ganância desmesurada alimentada pela ansiedade.

*Aspecto de saúde: como consequência desse estresse extremo, poderá desenvolver alguma doença.*'),

(999, 'pessoal_bloqueio', 'Bloqueio de Compaixão Universal (999)', 'Prolongamento exaustivo de ciclos que já deveriam ter se encerrado. Este bloqueio cria forte apego ao passado, ressentimentos duradouros e dificuldades crônicas em perdoar e soltar o que não serve mais. Pode gerar desilusões frequentes, perdas emocionais e uma sensação de sacrifício contínuo pelos outros. O antídoto cármico definitivo é o desenvolvimento da compaixão universal, a prática ativa do desapego, o perdão incondicional (a si mesmo e aos outros) e a aceitação pacífica das conclusões.

*Aspecto de saúde: tudo isto pode afetar diretamente o sistema nervoso e o coração.*')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
