# Vibraweb — Claude Instructions

## Regras obrigatórias

### 1. Documentação
- **Toda nova funcionalidade** (frontend ou backend) deve ter um arquivo `.md` em `.claude/docs/feature-<nome>.md`.
- Quando uma funcionalidade é atualizada, atualizar o documento correspondente.
- Quando uma funcionalidade é removida, remover ou atualizar o documento.

### 2. Testes
- Após qualquer alteração no frontend, rodar `npm run build` e confirmar build limpo.
- Para Neon Functions ou SQL, testar a query/função antes de marcar como concluído.

### 3. Arquitetura do Repositório (Frontend e Backend)

O repositório é explicitamente dividido em dois diretórios principais para organização modular:

**`frontend/` (browser):**
- Contém toda a base em React, os arquivos originais do Vite e as tipagens de UI.
- Faz chamadas ao **Neon Auth + Neon Data API** pelo SDK `@neondatabase/neon-js`.
- Toda proteção de dados é feita por **RLS** no banco — não confiar em validações de UI.
- **Jamais** colocar chaves S3, tokens de pagamento ou qualquer credencial sensível no código.

**`backend/` (Neon, Functions e Configs):**
- `backend/neon/migrations/` guarda a base compatível aplicada no Neon.
- `backend/supabase/migrations/` é histórico legado reaproveitado na migração inicial; novas migrations devem ir para Neon.
- Contém lógica para permitir que usuários customizem as definições via tabela `user_interpretations`.
- Toda lógica que exige privilégios elevados vai em **Neon Functions**.
- Neon Functions usam variáveis server-side injetadas pelo Neon, como `DATABASE_URL` e credenciais S3.

### 4. Credenciais e variáveis de ambiente
- Todas as variáveis ficam no arquivo `.env.local` (nunca commitado).
- Frontend usa apenas variáveis prefixadas `VITE_` (expostas ao browser por design).
- Variáveis sem prefixo `VITE_` são exclusivas para Neon Functions / Node.
- Nunca hardcodar URLs, tokens ou chaves no código-fonte.

### 5. Idioma
- Todo texto de UI em **português (pt-BR)**.
- Código, nomes de variáveis e comentários em inglês.

---

## Visão geral do projeto

**Vibraweb** — SaaS cujo foco principal é criar mapas numerológicos completos tanto para o usuário final quanto para a plataforma funcionar como base para testes e análises rápidas, sem a necessidade de gerar o mapa completo. 

**Planos**:
- **7 Dias de Teste Gratuito**: Para todos os novos cadastros.
- **Plano Inicial / Essencial**: Uso da plataforma para análises e geração do arquivo completo do mapa numerológico com restrições de personalização (possui marca e marca d'água do Vibraweb).
- **Plano Premium / Pro**: Acesso sem restrições de personalização, permitindo retirar a marca do Vibraweb (white-label) e adicionar a própria marca, cores da empresa, etc.

| Camada | Tecnologia |
|--------|------------|
| Frontend | Vite + React 19 + TypeScript |
| Banco | Neon Lakebase Postgres + RLS |
| Auth | Neon Auth |
| Data API | Neon Data API |
| Storage | Neon Object Storage |
| Backend sensível | Neon Functions |
| Deploy | A definir |

## Variáveis de ambiente (`.env.local`)

```
VITE_NEON_AUTH_URL=https://.../auth
VITE_NEON_DATA_API_URL=https://.../rest/v1
VITE_NEON_FUNCTION_API_URL=https://...neon.tech
DATABASE_URL=postgresql://...                  # Node/Functions
DATABASE_URL_UNPOOLED=postgresql://...         # migrations/imports
AWS_*                                          # Neon Object Storage, nunca no browser
```

## Comandos

Todos os comandos de client-side devem ser executados dentro da pasta `frontend/`:

```bash
cd frontend && npm run dev      # servidor local → http://localhost:5173
cd frontend && npm run build    # type-check TypeScript + build de produção
cd frontend && npm run preview  # preview do build de produção
```

## Documentação interna

Toda a documentação técnica fica em `.claude/docs/`:

| Arquivo | Conteúdo |
|---------|----------|
| `feature-numerology-engine.md` | Algoritmo Caldaico, funções, NumerologyMap |
| `feature-analysis-app.md` | Workspace SaaS, fluxo de dados, componentes, layout de cards |
| `feature-preview-document.md` | **Estrutura de blocos do documento**, renderização, impressão, textos do banco |
| `feature-marketing-site.md` | Landing page, seções, CTAs |
| `feature-neon.md` | Backend Neon, schema, Auth, Data API, Storage, Functions e migração |
| `feature-supabase.md` | Histórico legado Supabase usado como origem da migração |
| `feature-agent-architecture.md` | Subagentes (`.claude/agents/`), modelos de IA por função, diretrizes de UI/UX |

## Agentes especializados

O projeto usa subagentes definidos em `.claude/agents/` (`frontend-ui`, `backend-neon`, `numerology-engine`, `docs-writer`, `build-qa`), cada um com modelo de IA e escopo próprios. Toda alteração de UI/UX **deve** seguir as diretrizes em `.claude/context/ui-guidelines/` (fonte de verdade para páginas, componentes e fluxos do frontend). Ver `feature-agent-architecture.md` para detalhes.

## Estrutura do Documento Numerológico

O arquivo gerado segue uma hierarquia de **5 blocos principais**, cada um começando em nova página:

1. **Capa e Apresentação** — Cover · Orientação · Resumo "Os Seus Números"
2. **A Essência** — Motivação · Impressão · Expressão · Talento Oculto · Aptidões
3. **O Caminho e os Desafios** — Dia Natalício · Número Psíquico · Destino · Missão · Lições · Débitos · Tendências · Resposta Subconsciente
4. **Ciclos de Tempo** — Ciclos de Vida · Desafios · Momentos Decisivos · Ano/Mês/Dia Pessoal
5. **Relacionamentos e Cabalística** — Harmonia Conjugal · Triângulo da Vida

**Regra de renderização**: blocos condicionais (que dependem de dados calculados) aparecem automaticamente conforme os dados existem. Textos são adicionados no banco Neon; o sistema cria as páginas automaticamente.

Ver `feature-preview-document.md` para detalhes completos.
