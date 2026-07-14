-- 015_sample_client.sql
-- Cliente modelo fixo, usado como exemplo nos previews de /app/blocos e
-- /app/marca (Guilherme, 2026-07-11). Guarda só a IDENTIDADE (nome + data de
-- nascimento) — o cálculo numerológico (calcPessoal) continua rodando ao vivo
-- no frontend a partir desses dois valores, nunca é congelado aqui, porque
-- vários campos (Ano Pessoal, Dia Pessoal, Meses Pessoais, Arcano Atual)
-- dependem da data atual e ficariam desatualizados se fossem salvos prontos.
--
-- Singleton: sempre 1 linha (id fixo = 1). Leitura liberada pra qualquer
-- usuário autenticado (não é dado sensível); sem policy de insert/update via
-- app — ajustes futuros são feitos direto no banco (SQL) ou por uma tela
-- administrativa a construir depois, não pelo fluxo normal do consultor.

CREATE TABLE IF NOT EXISTS public.sample_client (
  id smallint PRIMARY KEY DEFAULT 1,
  subject text NOT NULL,
  data_nascimento text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sample_client_singleton CHECK (id = 1)
);

ALTER TABLE public.sample_client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read the sample client"
  ON public.sample_client
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.sample_client (id, subject, data_nascimento)
VALUES (1, 'João da Silva', '15/03/1985')
ON CONFLICT (id) DO NOTHING;
