---
name: supabase-mcp
description: Utilizar o Supabase via MCP para edição de tabelas e políticas RLS no projeto Vibraweb.
---

# Supabase MCP 

Esta skill instrui o agente de IA (como o Claude, Gemini ou Antigravity) em como interagir com o banco de dados do Supabase (`ribbastgcdjdobplzopj.supabase.co`) usando o protocolo MCP ou as credenciais locais.

## Quando usar
- Quando for exigido criar ou modificar tabelas no banco de dados.
- Quando for preciso adicionar, alterar ou auditar políticas de Row Level Security (RLS).
- Quando precisar consultar registros de tabelas ou criar Functions / Edge Functions.

## Instruções de Acesso
No arquivo `.env.local` na raiz do projeto `c:\Dev\vibraweb`, você encontrará:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

Se você possui um MCP Server configurado para o Supabase (como `@supabase/mcp` ou o `postgres-mcp`), invoque as ferramentas do MCP fornecendo essas credenciais ou utilizando o projeto vinculado localmente (`npx supabase link --project-ref ribbastgcdjdobplzopj`). 

Caso o MCP de PostgreSQL direto exija uma string de conexão e ela não esteja disponível de imediato, e caso o Supabase MCP não esteja instalado, utilize scripts Supabase JS via NodeJS e a `service_role_key` para conectar e aplicar migrations (ou solicite que o usuário aplique as DDL geradas no painel SQL do admin).

### Convenções de Banco do Vibraweb
1. **Nunca** remova o RLS das tabelas sensíveis sem ter uma política forte substituta.
2. Todo o acesso anônimo/browser frontend deve ser suportado por políticas. O Frontend nunca deve possuir a service_role_key.
3. Quaisquer atualizações de schema devem ser preferencialmente documentadas na pasta de documentação técnica (.claude/docs/).
