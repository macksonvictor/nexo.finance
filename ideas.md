# NEXO – Brainstorm de Design

## Contexto
Aplicativo web premium de gestão financeira pessoal com foco em disciplina e crescimento patrimonial. Conceito: "Todo real recebe uma missão." Orçamento Base Zero. Deve parecer um banco digital premium, não uma planilha.

---

<response>
<text>

## Ideia 1: "Vault Architecture" – Estética de Cofre Digital

### Design Movement
Inspirado no **Swiss Design** com influências de interfaces bancárias de alta segurança (Private Banking UX). Referências visuais de cofres digitais e painéis de controle de missão.

### Core Principles
1. **Precisão Tipográfica**: Cada elemento tem posição e tamanho calculado com rigor matemático
2. **Hierarquia por Peso Visual**: Informações financeiras críticas dominam o viewport
3. **Contenção Elegante**: Cards como compartimentos de cofre — cada caixa financeira é visualmente um "compartimento"
4. **Silêncio Visual**: Espaço negativo como elemento de luxo

### Color Philosophy
Paleta monocromática com preto profundo (#0D0D0D) como base de autoridade. Cinza (#2E2E2E) para cards como aço escovado. Branco suave (#F5F5F5) para dados críticos — como números gravados em metal. Verde escuro (#1B4332) para crescimento. Vermelho discreto (#8B2500) para alertas.

### Layout Paradigm
Layout em **grid assimétrico** com sidebar fixa à esquerda (navegação vertical minimalista) e área principal dividida em módulos tipo "compartimentos". Dashboard usa layout de 3 colunas desiguais (1:2:1).

### Signature Elements
1. **Linhas de grade sutis** — como marcações de cofre, separando seções com linhas finas de 1px em cinza muito escuro
2. **Números com tipografia monospace** — valores financeiros em fonte monospace premium (JetBrains Mono ou Space Mono)
3. **Barras de progresso lineares ultra-finas** — elegantes, 2px de altura, com preenchimento gradual

### Interaction Philosophy
Transições calculadas e precisas. Nada de bounce ou elasticidade. Movimentos lineares com easing sutil (ease-out). Hover states com mudança de opacidade, não de cor. Cliques com feedback tátil via micro-escala (scale 0.98).

### Animation
- Entrada de cards: fade-in com translate-y de 8px, duração 300ms
- Números: contagem animada (count-up) ao carregar
- Barras de progresso: preenchimento gradual com delay escalonado
- Transição de páginas: crossfade suave de 200ms

### Typography System
- Display/Títulos: **Space Grotesk** (700) — geométrica, moderna, premium
- Corpo: **Space Grotesk** (400, 500) — consistência visual
- Valores financeiros: **JetBrains Mono** (500) — precisão numérica
- Labels/Captions: **Space Grotesk** (400) em uppercase com letter-spacing amplo

</text>
<probability>0.07</probability>
</response>

---

<response>
<text>

## Ideia 2: "Obsidian Finance" – Estética de Pedra Preciosa Escura

### Design Movement
Inspirado no **Neobrutalism invertido** — ao invés de cores vibrantes e bordas grossas, usa a mesma honestidade visual mas com paleta escura e refinada. Referências de dashboards de criptomoedas premium e apps de wealth management.

### Core Principles
1. **Transparência Radical**: Cada número é visível, cada cálculo é explícito
2. **Materialidade Digital**: Superfícies com profundidade sutil — como obsidiana polida
3. **Ritmo Visual**: Espaçamento baseado em escala de 8px com ritmo vertical consistente
4. **Funcionalidade Ornamental**: Decoração só existe se também informa

### Color Philosophy
Preto obsidiana (#0D0D0D) como superfície primária — profundo e rico. Cards em (#1A1A1A) com borda sutil de 1px em (#2E2E2E) criando efeito de "flutuação". Texto em escala de cinza com 4 níveis: #F5F5F5 (primário), #BFBFBF (secundário), #666666 (terciário), #404040 (quaternário). Verde musgo (#2D5016) para positivo. Vermelho terra (#6B2020) para negativo.

### Layout Paradigm
**Sidebar colapsável** com ícones hexagonais (referência ao logo). Área principal com layout de **masonry adaptativo** — cards de diferentes alturas se encaixam organicamente. No mobile, stack vertical com cards full-width.

### Signature Elements
1. **Ícone hexagonal** do logo como motif recorrente — indicadores, bullets, avatares de caixas
2. **Glassmorphism sutil** em overlays e modais — blur de 20px com opacidade 80%
3. **Micro-indicadores de tendência** — setas pequenas ao lado de valores mostrando variação

### Interaction Philosophy
Interações com "peso" — elementos parecem ter massa. Drag com inércia. Hover com elevação (box-shadow aumenta). Transições com spring physics leve. Feedback háptico visual em ações destrutivas (shake sutil).

### Animation
- Cards: entrada com scale de 0.95 para 1.0, opacity 0 para 1, spring tension
- Gráficos: desenho progressivo das linhas/barras
- Sidebar: expansão com ease-in-out de 250ms
- Números: morphing suave entre valores antigos e novos
- Page transitions: slide horizontal com fade

### Typography System
- Display/Títulos: **Outfit** (600, 700) — geométrica mas com personalidade
- Corpo: **Outfit** (400, 500) — legibilidade excepcional em fundos escuros
- Valores financeiros: **DM Mono** (500) — monospace elegante
- Labels: **Outfit** (500) em 11px uppercase, tracking 0.08em

</text>
<probability>0.05</probability>
</response>

---

<response>
<text>

## Ideia 3: "Carbon Ledger" – Estética de Fibra de Carbono

### Design Movement
Inspirado em **interfaces automotivas de luxo** (Porsche, McLaren dashboards) e terminais financeiros Bloomberg. Precisão industrial encontra elegância financeira.

### Core Principles
1. **Instrumentação**: Interface como painel de instrumentos — cada widget é um "gauge"
2. **Densidade Informacional Elegante**: Muita informação, zero confusão
3. **Performance Visual**: Design que transmite velocidade e eficiência
4. **Contraste Cirúrgico**: Uso preciso de contraste para guiar o olho

### Color Philosophy
Base carbono (#0D0D0D) com textura sutil. Cards em (#1A1A1A) com micro-gradiente vertical (1A1A1A → 222222). Acentos em branco puro (#FFFFFF) para dados críticos — como instrumentos iluminados. Verde (#1B5E20) para ganhos. Vermelho (#B71C1C) discreto para perdas. Linha divisória em (#2E2E2E).

### Layout Paradigm
**Command center layout** — header fixo com breadcrumb e indicadores-chave. Sidebar esquerda estreita (64px) com ícones. Área principal com grid de 12 colunas. Footer com barra de status estilo terminal.

### Signature Elements
1. **Indicadores circulares** tipo gauge para percentuais (distribuição, score)
2. **Grid lines sutis** no fundo — como papel milimetrado em cinza muito escuro
3. **Status bar** no topo com micro-informações (mês atual, total distribuído, saldo)

### Interaction Philosophy
Respostas instantâneas. Zero delay perceptível. Hover com highlight de borda (glow sutil). Click com ripple minimalista em branco com opacidade baixa. Tooltips aparecem com 100ms de delay. Drag & drop com ghost element semi-transparente.

### Animation
- Gauges circulares: preenchimento rotacional com easing
- Cards: fade-in escalonado (stagger) de 50ms entre cards
- Números grandes: slot-machine animation (dígitos rolam)
- Gráficos: reveal progressivo da esquerda para direita
- Modais: scale de 0.9 para 1.0 com backdrop blur

### Typography System
- Display: **Sora** (600, 700) — moderna, técnica, premium
- Corpo: **Sora** (400, 500) — excelente legibilidade
- Dados financeiros: **IBM Plex Mono** (500) — industrial e precisa
- Micro-labels: **Sora** (500) em 10px uppercase, tracking 0.1em

</text>
<probability>0.04</probability>
</response>

---

## Decisão

**Escolhida: Ideia 1 — "Vault Architecture"**

A estética de cofre digital é a que melhor se alinha com o conceito "Todo real recebe uma missão" — cada compartimento/caixa é literalmente um cofre onde o dinheiro é alocado com propósito. O Swiss Design traz a precisão e seriedade que um app financeiro premium exige, sem ser excessivamente decorativo.
