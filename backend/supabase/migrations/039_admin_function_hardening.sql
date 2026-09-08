-- 039_admin_function_hardening.sql
-- Mantém helpers de autorização fora do schema exposto pela Data API.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
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

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins manage global interpretations" ON public.interpretacoes;
CREATE POLICY "Admins manage global interpretations"
  ON public.interpretacoes
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins manage billing plans" ON public.billing_plans;
CREATE POLICY "Admins manage billing plans"
  ON public.billing_plans FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Authenticated users read active plans" ON public.billing_plans;
CREATE POLICY "Authenticated users read active plans"
  ON public.billing_plans FOR SELECT TO authenticated
  USING (status = 'active' OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins manage global settings" ON public.global_settings;
CREATE POLICY "Admins manage global settings"
  ON public.global_settings FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins manage global templates" ON public.global_templates;
CREATE POLICY "Admins manage global templates"
  ON public.global_templates FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Authenticated users read active templates" ON public.global_templates;
CREATE POLICY "Authenticated users read active templates"
  ON public.global_templates FOR SELECT TO authenticated
  USING (is_active OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins append audit log" ON public.admin_audit_log;
CREATE POLICY "Admins append audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()) AND actor_id = auth.uid());

-- Essas funções são internas: uma é chamada pelo trigger do perfil e a outra
-- pelo fluxo de criação de usuário. Nenhuma deve ser RPC pública.
ALTER FUNCTION public.check_role_update() SET search_path = public;
REVOKE ALL ON FUNCTION public.check_role_update() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP FUNCTION IF EXISTS public.is_admin();
