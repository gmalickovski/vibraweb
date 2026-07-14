# Vibraweb — Claude Instructions

## Regras obrigatórias

### 1. Documentação
- **Toda nova funcionalidade** (frontend ou backend) deve ter um arquivo `.md` em `.claude/docs/feature-<nome>.md`.
- Quando uma funcionalidade é atualizada, atualizar o documento correspondente.
- Quando uma funcionalidade é removida, remover ou atualizar o documento.

### 2. Testes
- Após qualquer alteração no frontend, rodar `npm run build` e confirmar build limpo.
- Para Edge Functions ou SQL, testar a query/função antes de marcar como concluído.

### 3. Arquitetura do Repositório (Frontend e Backend)

O repositório é explicitamente dividido em dois diretórios principais para organização modular:

**`frontend/` (browser):**
- Contém toda a base em React, os arquivos originais do Vite e as tipagens de UI.
- Faz chamadas ao Supabase utilizando apelas a **anon key**.
- Toda proteção de dados é feita por **RLS** no banco — não confiar em validações de UI.
- **Jamais** colocar service role key, tokens de pagamento ou qualquer credencial sensível no código.

**`backend/` (Supabase, Edge Functions e Configs):**
- Contém a subpasta `supabase/migrations/` responsável por guardar histórico de todos os comandos SQL executados na base via Painel ou por MCPs.
- Contém lógica para permitir que usuários customizem as definições via tabela `user_interpretations`.
- Toda lógica que exige privilégios elevados vai em Edge Functions.
- Edge Functions usam a service role key via variável de ambiente (não a pub-key).

### 4. Credenciais e variáveis de ambiente
- Todas as variáveis ficam no arquivo `.env.local` (nunca commitado).
- Frontend usa apenas variáveis prefixadas `VITE_` (expostas ao browser por design).
- Variáveis sem prefixo `VITE_` são exclusivas para Edge Functions / Node.
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
| Banco | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/senha) |
| Backend sensível | Supabase Edge Functions (Deno) — a implementar |
| Deploy | A definir |

## Variáveis de ambiente (`.env.local`)

```
VITE_SUPABASE_URL=https://ribbastgcdjdobplzopj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...      # frontend — seguro
# VITE_SUPABASE_SERVICE_ROLE_KEY=...           # NUNCA usar no frontend
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
| `feature-preview-document.md` | **Estrutura de blocos do documento**, renderização, impressão, textos do Supabase |
| `feature-marketing-site.md` | Landing page, seções, CTAs |
| `feature-supabase.md` | Schema do banco, RLS, funções client, roadmap Edge Functions |

## Estrutura do Documento Numerológico

O arquivo gerado segue uma hierarquia de **5 blocos principais**, cada um começando em nova página:

1. **Capa e Apresentação** — Cover · Orientação · Resumo "Os Seus Números"
2. **A Essência** — Motivação · Impressão · Expressão · Talento Oculto · Aptidões
3. **O Caminho e os Desafios** — Dia Natalício · Número Psíquico · Destino · Missão · Lições · Débitos · Tendências · Resposta Subconsciente
4. **Ciclos de Tempo** — Ciclos de Vida · Desafios · Momentos Decisivos · Ano/Mês/Dia Pessoal
5. **Relacionamentos e Cabalística** — Harmonia Conjugal · Triângulo da Vida

**Regra de renderização**: blocos condicionais (que dependem de dados calculados) aparecem automaticamente conforme os dados existem. Textos são adicionados no Supabase; o sistema cria as páginas automaticamente.

Ver `feature-preview-document.md` para detalhes completos.
