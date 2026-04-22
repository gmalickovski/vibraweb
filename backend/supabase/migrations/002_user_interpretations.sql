-- Criação da tabela para guardar interpretações personalizadas por usuário
CREATE TABLE IF NOT EXISTS public.user_interpretations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  tipo text NOT NULL,
  texto text,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, numero, tipo)
);

-- Ativar segurança
ALTER TABLE public.user_interpretations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários gerenciam as próprias interpretações
CREATE POLICY "Users can manage their own interpretations" 
  ON public.user_interpretations 
  FOR ALL 
  USING (auth.uid() = user_id);
