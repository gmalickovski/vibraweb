# Diretrizes de UI/UX - Módulo Web (React, TypeScript & Tailwind CSS) v2

> **Instrução para o Agente**: Este módulo estende o `diretrizes-ui.md`. Aplique estas regras estritamente para aplicações e interfaces Web (Mobile, Tablet e Desktop).

---

## 1. Abordagem Mobile-First & Breakpoints (Tailwind CSS)

Sempre escreva o CSS base direcionado para telas pequenas (< 640px) e adicione modificadores progressivos para telas maiores:

```yaml
breakpoints:
  sm: "640px"   # Mobile Paisagem / Tablets Pequenos
  md: "768px"   # Tablets (Portrait/Landscape)
  lg: "1024px"  # Desktops / Laptops
  xl: "1280px"  # Desktops Grandes
  2xl: "1536px" # Monitores Ultra-Wide
```

---

## 2. Diretrizes Específicas por Viewport / Dispositivo

### 📱 Mobile Web (< 640px)
* **Layout**: Coluna única (`flex flex-col gap-4`).
* **Navegação & Ações**: Ações primárias e barras de navegação fixadas na área inferior (*Thumb Zone*).
* **Alvos de Toque**: Mínimo de `48x48px` para todos os botões e links.
* **Formulários**: Inputs com `font-size >= 16px` para evitar zoom automático no iOS.

### 📐 Tablet Web (640px - 1023px)
* **Layout**: Transição para 2 ou 3 colunas (`md:grid md:grid-cols-2 lg:grid-cols-3`).
* **Adaptação**: Menus laterais (*sidebars*) devem ser colapsáveis (*drawers*) ou flutuantes quando em modo retrato.

### 💻 Desktop Web (>= 1024px)
* **Layout**: Menus horizontais expandidos e sidebars fixas.
* **Largura Máxima**: Limite o container principal (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) para evitar esticamento excessivo do conteúdo em telas grandes.
* **Interatividade**: Foco visível via teclado (`focus-visible:ring-2 focus-visible:ring-primary-500`) e estados claros de hover (`hover:bg-primary-600`).

---

## 3. Otimização de Performance, Leitura & DOM

* **Comprimento de Linha**: Limite textos contínuos entre **40 a 80 caracteres por linha** (`max-w-prose` ou `max-w-2xl`).
* **Prevenção de CLS (Cumulative Layout Shift)**: Imagens e skeletons com `aspect-ratio` definido antes do carregamento.
* **Tabelas & Métricas**: Utilize numerais monospaçados (`font-mono` ou `tabular-nums`) para evitar oscilação visual.
* **Profundidade DOM**: Máximo de **4 níveis de aninhamento** por componente usando HTML5 semântico (`<main>`, `<article>`, `<nav>`, `<aside>`).

---

## 4. Padrões de Código (React + TypeScript)

```tsx
// Exemplo de Componente Web Responsivo e Acessível
interface CardProps {
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
  isDisabled?: boolean;
  onAction?: () => void;
}

export const ProductCard = ({
  title,
  description,
  variant = 'default',
  isDisabled = false,
  onAction,
}: CardProps) => {
  return (
    <article
      className={`p-4 sm:p-6 rounded-2xl border transition-all ${
        variant === 'highlighted'
          ? 'bg-surface-elevated border-primary-500/30 shadow-lg'
          : 'bg-surface border-surface-border'
      }`}
    >
      <h3 className="text-lg sm:text-xl font-bold text-text-strong">{title}</h3>
      <p className="mt-2 text-sm text-text-weak line-clamp-3">{description}</p>
      <button
        type="button"
        disabled={isDisabled}
        onClick={onAction}
        className="mt-4 w-full sm:w-auto px-6 py-3 min-h-[48px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
      >
        Acessar
      </button>
    </article>
  );
};
```
