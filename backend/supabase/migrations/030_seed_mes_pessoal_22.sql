-- Migration 030: Seed Mês Pessoal 22 — único número mestre faltando na
-- cobertura de pessoal_mesPessoal (já existia 1-9 e 11).

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(22, 'pessoal_mesPessoal', 'Mês Pessoal 22', 'Um mês para colocar grandes ideias em prática com praticidade e eficiência. É um período especialmente favorável para começar projetos ambiciosos, já que costuma trazer resultados sólidos tanto no campo material quanto no espiritual. Sendo o mês mais poderoso do ciclo, evite desperdiçar a oportunidade — ela pode não se repetir tão cedo.')
ON CONFLICT (numero, tipo)
DO UPDATE SET texto = EXCLUDED.texto, titulo = EXCLUDED.titulo;
