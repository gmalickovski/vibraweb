-- Migration 020: Preenche lacunas pontuais em categorias já quase completas
-- Levantamento via SQL (2026-07-12) mostrou 4 números faltando em categorias
-- que já tinham cobertura quase total:
--   - pessoal_licao_carmica: tinha 1-8, faltava o 9 (calcLicoesCarmicas
--     retorna dígitos 1-9 ausentes do nome, então 9 é um resultado válido).
--   - pessoal_mesPessoal: tinha 1-9, faltava o 11 (Mês Pessoal preserva
--     número mestre — calcMesesPessoais usa reduce() default true).
--   - pessoal_diaPessoal: tinha 1-9, faltavam 11 e 22 (Dia Pessoal também
--     preserva número mestre — calcDiaPessoal usa reduce(..., true)).

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES

(9, 'pessoal_licao_carmica', 'Lição Cármica 9', 'Esta é a lição da compaixão pela humanidade, do amor como a lei maior da evolução espiritual. A falta de solidariedade, o egoísmo, a negligência nas responsabilidades sobre os outros, a insensibilidade pela dor alheia e a dureza de sentimento vêm prejudicando o bom andamento da sua evolução espiritual.

Precisa desenvolver a compaixão como sentimento mais elevado do amor e assumir a sua parcela das responsabilidades concernentes ao progresso material e espiritual de toda a humanidade; cultivar a generosidade e o perdão, praticar a caridade moral e material, exercitar a ética, oferecer a outra face da verdade aos que lhe ofendem.'),

(11, 'pessoal_mesPessoal', 'Mês Pessoal 11', 'Um mês favorável às grandes realizações e revelações, sejam elas de cunho material, mental ou espiritual. Ideal para pôr as ideias em ordem, pois a intuição estará mais aflorada, a inteligência vibrante e a imaginação correndo solta.

Período favorável para os ajustes daquilo que pode melhorar o ser humano e a sua espiritualidade — evite decisões puramente impulsivas e aproveite a clareza incomum deste mês para planejar com visão de longo prazo.'),

(11, 'pessoal_diaPessoal', 'Dia Pessoal 11', 'Dia propício para focar nos ideais superiores; confiar na intuição; exercer o poder com humildade e servir de exemplo para os outros; cultivar amizades; manter a paciência diante das contrariedades.

É um dia de sensibilidade amplificada — bom para insights, decisões que exigem visão mais ampla e conversas que pedem verdade e profundidade, mas que também pede cuidado redobrado com oscilações emocionais.'),

(22, 'pessoal_diaPessoal', 'Dia Pessoal 22', 'Dia propício para as ações beneficentes; exercer a diplomacia nas relações; agir com praticidade e realismo no trato dos assuntos do dia; expandir ao máximo as suas potencialidades.

É um dia que favorece dar passos concretos em direção a projetos grandes — organizar, estruturar e avançar de forma prática naquilo que tem impacto duradouro, sem perder de vista os detalhes do dia a dia.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
