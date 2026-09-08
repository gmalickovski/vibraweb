-- 038_admin_foundation.sql
-- Base administrativa configurável para o SaaS Vibraweb.
-- Os dados sensíveis de Stripe continuam fora do cliente; esta camada guarda
-- somente catálogo, IDs públicos e configuração editorial/design.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Textos globais continuam na tabela interpretacoes existente. O admin ganha
-- escrita sem retirar a leitura pública usada pelos previews atuais.
GRANT SELECT ON public.interpretacoes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.interpretacoes TO authenticated;

DROP POLICY IF EXISTS "Admins manage global interpretations" ON public.interpretacoes;
CREATE POLICY "Admins manage global interpretations"
  ON public.interpretacoes
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  currency text NOT NULL DEFAULT 'BRL'
    CHECK (currency = 'BRL'),
  monthly_price_cents integer NOT NULL DEFAULT 0 CHECK (monthly_price_cents >= 0),
  annual_price_cents integer NOT NULL DEFAULT 0 CHECK (annual_price_cents >= 0),
  stripe_product_id text,
  stripe_monthly_price_id text,
  stripe_annual_price_id text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'system',
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.global_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  template_type text NOT NULL DEFAULT 'report',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.billing_plans, public.global_settings,
  public.global_templates, public.admin_audit_log FROM anon, authenticated;

GRANT SELECT ON public.billing_plans, public.global_settings, public.global_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.billing_plans, public.global_settings, public.global_templates TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

DROP POLICY IF EXISTS "Authenticated users read active plans" ON public.billing_plans;
CREATE POLICY "Authenticated users read active plans"
  ON public.billing_plans FOR SELECT TO authenticated
  USING (status = 'active' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage billing plans" ON public.billing_plans;
CREATE POLICY "Admins manage billing plans"
  ON public.billing_plans FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated users read global settings" ON public.global_settings;
CREATE POLICY "Authenticated users read global settings"
  ON public.global_settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage global settings" ON public.global_settings;
CREATE POLICY "Admins manage global settings"
  ON public.global_settings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated users read active templates" ON public.global_templates;
CREATE POLICY "Authenticated users read active templates"
  ON public.global_templates FOR SELECT TO authenticated
  USING (is_active OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage global templates" ON public.global_templates;
CREATE POLICY "Admins manage global templates"
  ON public.global_templates FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins append audit log" ON public.admin_audit_log;
CREATE POLICY "Admins append audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) AND actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS billing_plans_status_order_idx
  ON public.billing_plans (status, sort_order);
CREATE INDEX IF NOT EXISTS global_settings_category_idx
  ON public.global_settings (category);
CREATE INDEX IF NOT EXISTS global_templates_active_order_idx
  ON public.global_templates (is_active, sort_order);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);

INSERT INTO public.billing_plans (slug, name, description, status, sort_order)
VALUES
  ('essencial', 'Essencial', 'Plano inicial para validar a proposta comercial.', 'draft', 10),
  ('pro', 'Pro', 'Plano completo para consultores em operação.', 'draft', 20)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.global_settings (setting_key, category, label, description, value)
VALUES
  ('report.block_order', 'report', 'Ordem global dos blocos', 'Ordem e visibilidade padrão dos blocos de relatório.', '{"order":[],"hidden":[]}'::jsonb),
  ('brand.default', 'design', 'Identidade visual padrão', 'Tokens globais usados quando o consultor não possui um template próprio.', '{"fontDisplay":"Poppins","fontBody":"Inter","palette":"vibraweb"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.global_templates (slug, name, description, template_type, config, is_active, is_system, sort_order)
VALUES
  ('vibraweb-default', 'Padrão Vibraweb', 'Template oficial usado como fallback do sistema.', 'report', '{}'::jsonb, true, true, 10)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.billing_plans IS 'Catálogo de planos e IDs públicos do Stripe; preços em centavos.';
COMMENT ON TABLE public.global_settings IS 'Configurações globais de conteúdo, ordem e design do sistema.';
COMMENT ON TABLE public.global_templates IS 'Templates oficiais editáveis apenas pelo administrador.';
COMMENT ON TABLE public.admin_audit_log IS 'Trilha de alterações administrativas para operações sensíveis.';
