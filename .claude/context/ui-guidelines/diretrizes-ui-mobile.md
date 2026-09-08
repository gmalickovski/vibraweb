# Diretrizes UI Design — Módulo Mobile (iOS, Android & Flutter)

> **Regra de Aplicação para Agentes**: Este arquivo é um complemento de `diretrizes-ui.md` (Base Universal). Aplique estas regras ao codificar aplicativos mobile (React Native, Flutter, Swift/SwiftUI, Kotlin/Jetpack Compose).

---

## 1. Áreas de Toque e Gestos
* **Alvo Mínimo de Toque**: Todos os elementos interativos (botões, ícones, checkboxes) DEVEM ter área clicável/tocável de pelo menos **48x48pt/px** (Lei de Fitts / WCAG 2.1 AA).
* **Espaçamento entre Ações**: Manter no mínimo 8px de separação entre botões adjacentes para evitar toques acidentais.
* **Redução do Custo de Interação**:
  * Substituir `<select>`/dropdowns longos por componentes tipo Stepper (`-` `1` `+`), Segmented Controls ou Bottom Sheets.
  * Posicionar botões de ação primária (ex: "Adicionar ao carrinho", "Continuar") próximos aos seletores e ao alcance do polegar (zona inferior da tela).

---

## 2. Safe Areas e Hardware
* **Respeito às Safe Areas**:
  * NUNCA posicionar textos ou botões interativos sob o notch, Dynamic Island, câmera frontal ou barra de gestos do sistema (home indicator).
  * Estender planos de fundo e artes até as bordas da tela (*full-bleed*), mas manter o conteúdo útil dentro das guias de margem segura (`SafeArea`).
* **Barras do Sistema**:
  * Manter a Barra de Status visível por padrão (ocultar apenas em experiências imersivas como leitores de mídia ou jogos).

---

## 3. Layout e Navegação
* **Navegação Principal**:
  * Utilizar `BottomNavigationBar` / `TabBar` no rodapé (3 a 5 destinos). Evitar hambúrguer menus ocultos para funcionalidades primárias.
* **Otimização para Telas Menores**:
  * Priorizar layout de coluna única vertical.
  * Otimizar o uso de contêineres: preferir espaçamento (princípio de proximidade) a múltiplos contêineres e bordas que poluem a tela pequena.
* **Hierarquia Vertical**:
  * Posicionar as informações mais importantes na área superior visível sem necessidade de rolagem.

---

## 4. Mapeamento por Framework / Linguagem

### A. Flutter (Dart)
```dart
// Usar tokens de espaçamento base 8
SizedBox(height: 16.0) // spacing.md
Padding(padding: EdgeInsets.all(16.0))

// Garantir Safe Area
SafeArea(child: BodyWidget())
```

### B. SwiftUI (iOS / Swift)
```swift
// Respeitar margens e safe area
VStack(spacing: 16) {
    Content()
}
.padding(.horizontal, 16)
.ignoresSafeArea(.all, edges: .bottom) // Apenas para background
```

### C. React Native / Tailwind (Mobile Web / Native)
```tsx
// Alvo de toque 48px e padding seguro
<TouchableOpacity className="min-h-[48px] min-w-[48px] justify-center items-center p-4 bg-primary rounded-lg">
  <Text className="text-white font-bold">Ação</Text>
</TouchableOpacity>
```

---

## 5. Checklist de Verificação Rápida para o Agente
1. [ ] Alvos de toque têm pelo menos 48x48pt/px?
2. [ ] O conteúdo está protegido dentro das Safe Areas do dispositivo?
3. [ ] A navegação principal está acessível na parte inferior da tela?
4. [ ] O contraste em telas OLED/Dark Mode atinge o mínimo de 4.5:1 para textos?
