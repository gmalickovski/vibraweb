# Diretrizes de UX e Engenharia de Usabilidade

Documento unificado de diretrizes de **User Experience (UX)** para construção de projetos Web, Mobile, Tablet e Desktop. Este guia foca nos modelos mentais, psicologia cognitiva, fluxos de interação e arquitetura de informação, mantendo apenas as definições essenciais de UI onde as duas disciplinas se cruzam.

---

## 1. Heurísticas Fundamentais de Usabilidade (Nielsen & Norman)

* **Visibilidade do Status do Sistema:** Mantenha o usuário informado sobre o que está acontecendo em tempo real através de feedback imediato (ex: telas *skeleton*, indicadores de progresso ou confirmações visuais de envio).
* **Correspondência com o Mundo Real:** Utilize linguagem, conceitos e metáforas familiares ao público-alvo, evitando jargões técnicos ou códigos internos do sistema.
* **Controle e Liberdade do Usuário:** Ofereça "saídas de emergência" claras (como botões de *Cancelar*, *Desfazer* e *Fechar*) para permitir a recuperação rápida de ações acidentais sem travar o usuário no fluxo.
* **Prevenção de Erros:** Projete a interface para evitar falhas antes que ocorram (validação de campos em tempo real, desativação de botões até o preenchimento correto e confirmações explícitas antes de ações destrutivas).
* **Reconhecer em vez de Recordar:** Minimize a carga de memória de curto prazo mantendo opções, instruções e históricos visíveis ou facilmente acessíveis durante o fluxo.
* **Diagnóstico e Recuperação de Erros:** Apresente mensagens de erro em linguagem clara e humana (sem códigos de erro genéricos), indicando exatamente onde ocorreu o problema e como corrigi-lo.

---

## 2. Leis Cognitivas de UX Aplicadas

* **Lei de Fitts (Ergonomia e Alcance):** O tempo para atingir um alvo depende da sua distância e tamanho. Ações primárias e críticas devem estar posicionadas em zonas de fácil acesso (ex: zonas do polegar em dispositivos móveis); ações destrutivas devem ficar em zonas periféricas ou requerer confirmação dupla.
* **Lei de Hick (Carga de Decisão):** O tempo para tomar uma decisão cresce com a quantidade e complexidade das opções. Reduza a fricção dividindo processos complexos, categorizando menus e limitando opções visíveis simultâneas.
* **Lei de Miller e *Chunking*:** A memória de trabalho comporta em média $7 \pm 2$ itens. Agrupe informações extensas em pequenos blocos lógicos (ex: formulários divididos em etapas, formatação de dados numéricos).
* **Efeito de Posição Serial:** As pessoas memorizam melhor o primeiro e o último item de uma sequência. Posicione ações vitais de conversão ou navegação no início e no final de menus e listas.
* **Lei de Jakob (Modelos Mentais):** Os usuários passam a maior parte do tempo em outros produtos digitais. Respeite convenções consolidadas do mercado (ex: carrinho de compras no canto superior direito, logo redirecionando para a home) para evitar curvas desnecessárias de aprendizado.

---

## 3. Arquitetura de Telas & Densidade Informativa por Contexto

A densidade de informação e a estrutura das telas devem se adaptar ao perfil de uso e à plataforma:

### Mobile & Formulários Públicos (Foco no Usuário Casual)
* **Princípio *One Thing per Page* (Uma Coisa por Página):** Divida fluxos longos em etapas focadas em uma única decisão ou tarefa lógica. Isso reduz a ansiedade, minimiza erros e acelera o preenchimento em telas pequenas.
* **Orientação ao Toque (Sem *Hover*):** Toda funcionalidade principal deve ser acionável via toque direto, sem depender de estados de passar o mouse (*hover*).

### Desktop & Sistemas Administrativos (Foco no Usuário Especialista / *Admin*)
* **Densidade Informativa Otimizada:** Para usuários operacionais de uso diário, o princípio de uma coisa por página pode ser ineficiente. Agrupe tarefas correlatas em uma mesma tela, utilize a largura total do navegador e permita visualização/edição rápida para priorizar a velocidade operacional.
* **Suporte à Navegação por Teclado:** Garanta tabulação lógica, atalhos de teclado e gestão clara de foco visual para usuários que trabalham em alta velocidade sem mouse.

---

## 4. Especificações Ergonomicamente Necessárias de UI (Ponte UX/UI)

Para garantir que a usabilidade projetada em UX não seja quebrada na implementação visual, aplique os seguintes limites mínimos:

| Plataforma / Contexto | Requisito Mínimo de Interação | Motivação de Usabilidade / UX |
| :--- | :--- | :--- |
| **Apple iOS** | Alvo de toque mínimo: $44 \times 44\text{ pt}$ | Garantir precisão e evitar erros de toque (*fat-finger*). |
| **Google Android** | Alvo de toque mínimo: $48 \times 48\text{ dp}$ | Adequação à anatomia média do polegar e indicador humano. |
| **Web / Desktop (WCAG AA)** | Alvo de toque mínimo: $24 \times 24\text{ CSS px}$ | Acessibilidade mínima para apontadores visuais e toque. |
| **Acessibilidade de Cor** | Contraste mínimo de $4.5:1$ (texto normal) | Garantir legibilidade sob diferentes condições de luz e visão. |

> **Regra de Ouro da Cor:** A cor nunca deve ser o único meio de transmitir informação. Associações visuais como ícones, rótulos e textos explicativos devem sempre acompanhar mensagens de status ou erro.

---

## 5. Design de Conteúdo (UX Writing)

* **Plain Language (Linguagem Simples):** Escreva de forma clara, curta e objetiva, utilizando o vocabulário cotidiano do usuário.
* **Voz Ativa e Direcionada à Ação:** Utilize frases diretas (ex: *"Confirmamos seu pagamento"* em vez de *"O pagamento foi confirmado pelo sistema"*).
* **Verbos Neutros de Hardware:** Prefira termos universais como *"Selecionar"*, *"Enviar"* ou *"Continuar"*, evitando instruções específicas como *"Clique aqui"* (inadequadas para telas sensíveis ao toque ou leitores de tela).
