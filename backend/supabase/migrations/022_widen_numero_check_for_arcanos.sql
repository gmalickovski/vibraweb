-- Migration 022: Amplia o CHECK de numero pra caber os 99 arcanos
-- Arcano é um número de 2 dígitos (concatenação de valores de letra
-- adjacentes no Triângulo da Vida) que pode chegar a 99 — não cabe no range
-- 0-22 usado pelos demais tipos. Arcano Regente, Sequência de Arcanos e
-- Arcano Atual são todos a MESMA lista de 99 textos (tipo 'pessoal_arcano'),
-- só variando qual número está em foco — não são categorias separadas.

ALTER TABLE public.interpretacoes
  DROP CONSTRAINT interpretacoes_numero_check;

ALTER TABLE public.interpretacoes
  ADD CONSTRAINT interpretacoes_numero_check CHECK (numero >= 0 AND numero <= 99);
