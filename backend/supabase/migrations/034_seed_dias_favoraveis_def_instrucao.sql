-- Migration 034: Dias Favoráveis vira sub-bloco do documento (grupo
-- "Previsões Temporais", ordem do documento de referência: Ano → Mês → Dia
-- Pessoal → Dias Favoráveis). Semeia a definição (parágrafo de abertura,
-- texto do documento de referência NumWeb) e a instrução de uso — os dias
-- favoráveis são FIXOS para a pessoa (calculados do dia+mês de nascimento)
-- e se repetem em TODOS os meses do ano, e o cliente precisa saber disso.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_dias_favoraveis', 'Definição de Dias Favoráveis', 'Os Dias Favoráveis são os dias do mês que vibram favoravelmente de acordo com o seu dia de nascimento, estabelecendo uma ambientação propícia aos melhores resultados. É sugerido marcar os compromissos mais importantes num desses dias, como entrevistas, assinatura de contratos, reuniões, transações financeiras e outras decisões importantes.'),

(1, 'estatico_instrucao_dias_favoraveis', 'Como usar os Dias Favoráveis', 'Os seus Dias Favoráveis são calculados a partir do dia e do mês do seu nascimento e não mudam: são os mesmos em todos os meses do ano, valendo para toda a vida.

Não é preciso recalcular nada — ao agendar um compromisso importante, basta conferir se a data cai num dos seus dias favoráveis listados abaixo. Se cair, a ambientação vibratória daquele dia estará mais propícia aos bons resultados.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
