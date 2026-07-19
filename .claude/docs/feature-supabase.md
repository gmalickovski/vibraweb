# Supabase Integration

**Client**: `src/lib/supabase.ts`

## Arquitetura de Segurança

- **Anon key** (`VITE_SUPABASE_ANON_KEY`) → usada no browser. Segura pois é pública por design.
- **Service role key** → NUNCA no frontend. Usar apenas em Edge Functions (server-side).
- Toda proteção de dados é feita por **Row Level Security (RLS)** no banco.
- Credenciais ficam exclusivamente no `.env.local` (nunca commitadas).

## Variáveis de ambiente

```
VITE_SUPABASE_URL=https://ribbastgcdjdobplzopj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # frontend — seguro expor
# SUPABASE_SERVICE_ROLE_KEY=...             # Edge Functions apenas
```

## Tabelas criadas

### `interpretacoes`
Textos interpretativos para cada número por tipo. Leitura pública via RLS.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | serial PK | |
| numero | integer | 1–22 |
| tipo | text | destino, expressao, motivacao, impressao, karma, ano_pessoal |
| titulo | text | |
| texto | text | |
| unique(numero, tipo) | | |

**RLS**: `SELECT` permitido para todos (anon e authenticated).  
**Seed**: 64 registros em pt-BR (números 1–9, 11, 22 × 5 tipos + 1–9 para ano_pessoal).

### `user_profiles`
Branding do consultor. Criado automaticamente no signup via trigger `on_auth_user_created`.

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid PK → auth.users | |
| consultant_name | text | 'Vibraweb' |
| consultant_contact | text | 'vibraweb.com.br' |
| logo_url | text nullable | |
| plan | text | 'free' / 'pro' |

**RLS**: `SELECT` e `UPDATE` apenas para o próprio usuário (`auth.uid() = id`).

### `analyses`
Análises salvas por usuário.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid → auth.users | ON DELETE CASCADE |
| type | text | pessoal / bebe / empresa / previsoes |
| subject | text nullable | nome do cliente |
| input_data | jsonb | snapshot de AnalysisData |
| result_data | jsonb nullable | snapshot de NumerologyMap |

**RLS**: SELECT, INSERT, UPDATE, DELETE apenas para o próprio usuário.  
**Index**: `(user_id, created_at DESC)`.

## Funções no client

| Função | Tabela | Auth |
|--------|--------|------|
| `fetchInterpretation(numero, tipo)` | interpretacoes + user_interpretations | anon/autenticado |
| `listUserInterpretations()` / `listDefaultInterpretationKeys()` | user_interpretations / interpretacoes | autenticado |
| `saveUserInterpretation(numero, tipo, texto)` / `deleteAllUserInterpretations()` | user_interpretations | autenticado |
| `fetchUserProfile()` | user_profiles (inclui `brand_config`, `block_order`) | autenticado |
| `updateUserProfile(updates)` | user_profiles | autenticado |
| `saveAnalysis(type, subject, inputData, resultData)` | analyses | autenticado |
| `listAnalyses()` | analyses | autenticado |
| `deleteAnalysis(id)` | analyses | autenticado |

### Cache em memória (2026-07-18)
`fetchInterpretation`/`listUserInterpretations`/`listDefaultInterpretationKeys` e `fetchUserProfile` eram chamados de novo em toda navegação/re-render, e `fetchInterpretation` fazia até 4 round-trips de rede **por chamada** (era invocado uma vez por número/tipo — centenas de vezes em telas como o preview de exemplo ou Personalizar Textos). Agora `supabase.ts` mantém um cache module-level (singleton, dura a sessão da aba):
- `interpretacoes` (textos padrão, nunca deletados) e `user_interpretations` (personalização global do consultor) → 1 bulk-fetch cada, feito uma única vez; toda chamada seguinte é um lookup síncrono em `Map`.
- `user_profiles` (perfil, `brand_config`/templates de marca, `block_order`) → mesmo padrão, 1 fetch por sessão.
- `saveUserInterpretation`/`deleteAllUserInterpretations`/`updateUserProfile` atualizam o cache (write-through) — não precisa recarregar do banco depois de salvar/restaurar.

Textos específicos de cada análise (`analyses.text_overrides`) e templates de marca (`user_profiles.brand_config`) já eram uma única coluna JSONB por linha — sem N+1 aí, o gargalo era só as tabelas normalizadas acima.

## Políticas RLS ativas (verificado)

```
analyses         | SELECT  | auth.uid() = user_id
analyses         | INSERT  | auth.uid() = user_id
analyses         | UPDATE  | auth.uid() = user_id
analyses         | DELETE  | auth.uid() = user_id
interpretacoes   | SELECT  | true (público)
user_profiles    | SELECT  | auth.uid() = id
user_profiles    | UPDATE  | auth.uid() = id
```

## TODO — Edge Functions (backend seguro)

- `generate-pdf` — geração de PDF com branding white-label (precisa de libs server-side)
- `generate-docx` — geração de DOCX
- `stripe-webhook` — processamento de pagamentos Pro

Estas funções usarão a service role key e **nunca** serão expostas ao browser.
