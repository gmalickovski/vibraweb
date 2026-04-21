-- 1. Cria a nova coluna caso ela ainda não exista
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Restringe a alteração dessa coluna para os usuários comuns pelo DB:
CREATE OR REPLACE FUNCTION check_role_update() RETURNS trigger AS $$
BEGIN
   -- Impede que usuários não administradores mudem a própria role
   IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
          -- Bloqueia de imediato (a menos que seja feita pelo JWT mestre/dashboard)
          NEW.role := OLD.role;
      END IF;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_role_change ON user_profiles;
CREATE TRIGGER prevent_role_change
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION check_role_update();

-- Opcional para você rodar manualmente para seus usuários de teste:
-- UPDATE user_profiles SET role = 'admin' WHERE id = 'ID_DO_SEU_USUARIO_AQUI';
