-- Migration 036: introduções de grupo (abertura de "capítulo") para os 5
-- grupos que ainda abriam com o título seco — Personalidade, Propósito de
-- Vida, Aspectos Cármicos, Previsões Temporais e Relacionamentos. Ciclos e
-- Triângulo já tinham as suas (migrations 028/031/035). Textos curtos
-- (2-3 linhas) que apresentam o CONJUNTO, sem repetir as definições de cada
-- item logo abaixo — e sem jargão interno ("bloco", "seção do sistema").
-- Renderizados pelo section-heading (introTexto); editáveis em Textos →
-- Introduções de Categoria.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_def_personalidade_intro', 'Introdução — Personalidade', 'Esta primeira parte do mapa revela quem você é na essência: o que motiva a sua alma, a imagem que você projeta no mundo, a forma como se expressa e os talentos que carrega — inclusive os que ainda não despertaram. É o retrato vibracional da sua personalidade.'),

(1, 'estatico_def_proposito_vida_intro', 'Introdução — Propósito de Vida', 'Se a personalidade mostra quem você é, esta parte mostra para quê você veio: a energia especial do seu dia de nascimento, a trajetória traçada pelo Destino, a Missão que une identidade e caminho, e as aptidões que sustentam a sua realização profissional.'),

(1, 'estatico_def_aspectos_carmicos_intro', 'Introdução — Aspectos Cármicos', 'Nem tudo no mapa fala de dons — esta parte revela o que veio para ser trabalhado: as lições que a alma ainda precisa aprender, os padrões do passado a reequilibrar, as energias em excesso no nome e a forma como você reage instintivamente sob pressão.'),

(1, 'estatico_def_previsoes_intro', 'Introdução — Previsões Temporais', 'A vibração dos números também se desdobra no tempo presente: o Ano, o Mês e o Dia Pessoal indicam o clima energético de cada período, e os Dias Favoráveis apontam as melhores datas do mês para as decisões importantes. Use esta parte como bússola prática do dia a dia.'),

(1, 'estatico_def_relacionamentos_intro', 'Introdução — Relacionamentos', 'Aqui o mapa olha para os vínculos: a partir do seu número de Missão, a Harmonia Conjugal revela com quais vibrações a sua energia flui naturalmente, quais exigem ajuste e quais pedem maior compreensão nas parcerias afetivas e de vida.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
