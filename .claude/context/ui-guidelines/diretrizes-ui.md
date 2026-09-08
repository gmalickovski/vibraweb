# Diretrizes Gerais de UI & Design Systems (Agentes de IA)

> **Uso do Arquivo**: Diretriz base universal para todos os agentes de IA que auxiliam na codificação e criação de interfaces (Web, Mobile, Desktop).

---

## 1. Modo de Operação (3-Tier Boundaries)

*   **✅ Sempre Fazer (Executar sem Perguntar)**:
    *   Utilizar Design Tokens em YAML/variáveis CSS em vez de valores hexadecimais soltos.
    *   Garantir contraste de texto mínimo WCAG 2.1 AA: **4.5:1** (texto normal) e **3:1** (texto grande/UI).
    *   Assegurar área de toque/clique mínima de **48x48pt/px** para qualquer elemento interativo.
    *   Prover estados visíveis de foco (*focus visible*) e suporte a navegação por teclado.
    *   Utilizar tom cinza escuro suave (`#121212`) como fundo do Modo Escuro (evitar `#000000` puro).

*   **⚠️ Perguntar Primeiro (Requer Confirmação)**:
    *   Alterar a estrutura/arquitetura de componentes reutilizáveis pré-existentes no projeto.
    *   Adicionar novas bibliotecas de UI ou dependências externas de design.

*   **🚫 Nunca Fazer (Regras Rígidas)**:
    *   Nunca utilizar cores hexadecimais brutas hardcoded diretamente nas visualizações.
    *   Nunca combinar fundo `#000000` puro com texto `#FFFFFF` puro (fadiga/vibração visual).
    *   Nunca inverter a cor de imagens ou ícones multicoloridos ao alternar temas.
    *   Nunca depender exclusivamente da cor para transmitir status/significado (adicione texto ou ícone).

---

## 2. Design Tokens (Fonte de Verdade)

```yaml
tokens:
  color:
    bg:
      base: "var(--color-bg-base)"        # Claro: #F8F9FA | Escuro: #121212
      surface: "var(--color-bg-surface)"  # Claro: #FFFFFF | Escuro: #1E1E1E
      elevated: "var(--color-bg-elevated)"# Claro: #FFFFFF | Escuro: #2D2D2D
    text:
      primary: "var(--color-text-primary)"  # Contraste >= 4.5:1 (#E8E8E8 no tema escuro)
      secondary: "var(--color-text-secondary)"
      muted: "var(--color-text-muted)"
    brand:
      primary: "var(--color-brand-primary)"
      accent: "var(--color-brand-accent)"
  spacing:
    base_unit: 8 # Escala base de 8px (4, 8, 12, 16, 24, 32, 48, 64px)
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
    xl: "32px"
  radii:
    button: "8px"
    card: "12px"
    input: "8px"
```

---

## 3. Dark Mode & Profundidade

*   **Elevação de Superfícies**: Substitua sombras por tons gradualmente mais claros nas camadas superiores (`base` -> `surface` -> `elevated`).
*   **Desaturação de Marcas**: Ajuste a saturação dos tons da marca no tema escuro para manter o contraste legível e evitar esforço visual.

---

## 4. Convenções Universais de Nomenclatura

*   **Componentes**: Nomear em `PascalCase` por intenção funcional (`ProductCard`, `SubmitButton`), nunca por aparência visual.
*   **Propriedades Booleanas**: Sempre utilizar prefixo indicativo (`hasIcon`, `isLoading`, `isDisabled`).
*   **Variações**: Utilizar `variant` (`primary`, `secondary`, `tertiary`) e `size` (`sm`, `md`, `lg`). Evitar nomes reservados da Web como `type` e `style`.
