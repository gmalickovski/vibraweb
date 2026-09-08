# Neon Integration

O backend oficial do Vibraweb é **Neon**, não Supabase.

## Serviços

- **Lakebase Postgres**: banco principal com RLS.
- **Neon Auth**: cadastro, login e sessões.
- **Neon Data API**: acesso browser-friendly às tabelas via SDK `@neondatabase/neon-js`.
- **Neon Object Storage**: buckets S3 compatíveis.
- **Neon Functions**: API server-side para operações com credenciais privadas.

## Projeto Neon

| Item | Valor |
|------|-------|
| Project | `Vibraweb` |
| Project ID | `steep-bird-54333440` |
| Branch | `production` |
| Branch ID | `br-long-mountain-aetp34nm` |
| Region | `aws-us-east-2` |

`neon.ts` é a fonte de verdade da infraestrutura Neon:

- `auth: true`
- `dataApi: true`
- bucket `uploads` privado
- bucket `brand-assets` com leitura pública
- função `api`

## Variáveis

Frontend usa somente variáveis `VITE_`:

```env
VITE_NEON_AUTH_URL=...
VITE_NEON_DATA_API_URL=...
VITE_NEON_FUNCTION_API_URL=...
```

Node, migrations e Functions usam variáveis privadas:

```env
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
NEON_AUTH_JWKS_URL=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT_URL_S3=...
AWS_REGION=...
```

As variáveis `AWS_*` pertencem ao Neon Object Storage e nunca devem ser expostas no browser.

## Cliente

O arquivo `frontend/src/lib/neon.ts` mantém o nome legado para evitar uma renomeação grande nos imports, mas agora inicializa o cliente Neon:

- Auth: `SupabaseAuthAdapter()` sobre Neon Auth.
- Dados: Neon Data API.
- Storage: via Neon Function, não direto no browser.

## Banco

A base foi aplicada no Neon por `scripts/migrate-neon.mjs`:

- `backend/neon/migrations/001_vibraweb_neon_baseline.sql`
- migrations legadas em `backend/supabase/migrations`, exceto a migration de Neon Object Storage.

Tabelas principais:

- `interpretacoes`
- `user_profiles`
- `user_interpretations`
- `analyses`
- `sample_client`
- `billing_plans`
- `global_settings`
- `global_templates`
- `admin_audit_log`

Neon Auth guarda usuários em `neon_auth.user`. O app usa `public.current_user_id()` nas policies compatíveis com o JWT do Neon.

## Storage

- `brand-assets`: leitura pública, usado para logos exibidas em previews e PDFs.
- `uploads`: privado, reservado para arquivos gerais.

Uploads de logo são enviados para a Neon Function `api` no caminho `/upload-brand-logo`. A função valida JWT do Neon Auth e grava o arquivo no bucket `brand-assets`.

## Migração Supabase

O projeto Supabase `vibraweb` (`ribbastgcdjdobplzopj`) é origem legada. Quando ele estiver ativo, importar dados vivos para o Neon:

- usuários compatíveis ou recriação via Neon Auth
- `user_profiles`
- `user_interpretations`
- `analyses`
- objetos do bucket legado `brand-assets`

Usuários com senha do Supabase podem precisar recriar senha/conta no Neon Auth, pois o hash de senha não é diretamente portável.
