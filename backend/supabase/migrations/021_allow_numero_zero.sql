-- Migration 021: Permite numero=0 em interpretacoes
-- O CHECK (numero >= 1 AND numero <= 22) nunca considerou que Desafio e
-- Resposta Subconsciente têm 0 como resultado numerológico VÁLIDO (não
-- ausência de dado) — calcDesafios/calcRespostaSubconsciente podem retornar
-- 0 legitimamente. O workaround anterior guardava esses casos sob numero=10,
-- mas fetchInterpretation() em supabase.ts tinha "if (!numero) return null",
-- que tratava 0 como ausente e nunca chegava a consultar o banco — ou seja,
-- pra qualquer cliente real com Desafio=0 ou Resposta Subconsciente=0, o
-- texto nunca aparecia. Corrigindo os dois lados: a guarda em código (já
-- ajustada) e o constraint aqui, migrando os 2 registros de numero=10 pra 0.

ALTER TABLE public.interpretacoes
  DROP CONSTRAINT interpretacoes_numero_check;

ALTER TABLE public.interpretacoes
  ADD CONSTRAINT interpretacoes_numero_check CHECK (numero >= 0 AND numero <= 22);

UPDATE public.interpretacoes
SET numero = 0, titulo = replace(titulo, '10', '0')
WHERE tipo IN ('pessoal_desafio', 'pessoal_respostaSubconsciente') AND numero = 10;
