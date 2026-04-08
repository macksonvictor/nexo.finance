# NEXO – Sistema de Gestão Financeira Pessoal

## 📋 Visão Geral

**NEXO** é um aplicativo web premium de gestão financeira pessoal baseado no conceito de **Orçamento Base Zero**, onde cada real recebe uma missão específica. O sistema foi construído com foco em disciplina financeira, crescimento patrimonial e uma experiência visual premium.

**Conceito Central:** "Todo real recebe uma missão."

---

## 🎨 Design & Identidade Visual

### Estilo: Vault Architecture
Inspirado no **Swiss Design** com influências de interfaces bancárias de alta segurança (Private Banking UX). Cada caixa financeira é visualmente um "compartimento de cofre".

### Paleta de Cores
- **Preto Principal:** `#0D0D0D` (base profunda)
- **Cinza Aço:** `#2E2E2E` (cards)
- **Branco Suave:** `#F5F5F5` (dados críticos)
- **Cinza Claro:** `#BFBFBF` (secundário)
- **Verde Escuro:** `#2D5016` (positivo/crescimento)
- **Vermelho Discreto:** `#8B2500` (alerta/negativo)

### Tipografia
- **Display/Títulos:** Space Grotesk (700) — geométrica, moderna
- **Corpo:** Space Grotesk (400, 500) — legibilidade premium
- **Valores Financeiros:** JetBrains Mono (500) — precisão numérica
- **Labels:** Space Grotesk (500) uppercase com letter-spacing

### Animações
- Entrada de cards: fade-in com translate-y, duração 300ms
- Números: contagem animada (count-up)
- Barras de progresso: preenchimento gradual com delay escalonado
- Transições: crossfade suave de 200ms

---

## 🏗️ Arquitetura Técnica

### Stack
- **Frontend:** React 19 + Vite
- **Styling:** TailwindCSS 4 + Custom CSS
- **State Management:** Zustand com persistência LocalStorage
- **Animações:** Framer Motion
- **Gráficos:** Recharts
- **Exportação:** jsPDF + jsPDF-AutoTable
- **Tipografia:** Google Fonts (Space Grotesk, JetBrains Mono)

### Estrutura de Pastas
```
client/
├── src/
│   ├── components/
│   │   ├── AnimatedNumber.tsx          # Contador animado de valores
│   │   ├── Sidebar.tsx                 # Navegação lateral
│   │   ├── Onboarding.tsx              # Tela inicial
│   │   ├── DashboardView.tsx           # Dashboard principal
│   │   ├── CaixasView.tsx              # Gerenciamento de caixas
│   │   ├── MetasView.tsx               # Gerenciamento de metas
│   │   ├── HistoricoView.tsx           # Histórico mensal
│   │   └── ErrorBoundary.tsx           # Tratamento de erros
│   ├── pages/
│   │   ├── Home.tsx                    # Página principal
│   │   └── NotFound.tsx                # Página 404
│   ├── stores/
│   │   └── useFinanceStore.ts          # Store Zustand
│   ├── lib/
│   │   ├── formatters.ts               # Utilitários de formatação
│   │   └── exportService.ts            # Serviços de exportação
│   ├── types/
│   │   └── finance.ts                  # Tipos TypeScript
│   ├── contexts/
│   │   └── ThemeContext.tsx            # Contexto de tema
│   ├── App.tsx                         # Componente raiz
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Estilos globais
├── index.html                          # HTML template
└── public/                             # Arquivos estáticos
```

---

## 💾 Modelo de Dados

### Tipos Principais

#### `Caixa`
Representa um compartimento de orçamento onde o dinheiro é alocado.
```typescript
interface Caixa {
  id: string;
  name: string;                    // Nome da caixa
  icon: string;                    // Emoji/ícone
  allocated: number;               // Valor alocado do orçamento
  spent: number;                   // Total gasto
  color: string;                   // Cor visual
  category: 'essencial' | 'investimento' | 'lazer' | 'reserva' | 'outro';
  transactions: Transaction[];     // Histórico de transações
  createdAt: string;              // Data de criação
}
```

#### `Transaction`
Registro de movimento financeiro dentro de uma caixa.
```typescript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;                   // ISO string
  type: 'expense' | 'income' | 'transfer';
  caixaId: string;
}
```

#### `Meta`
Objetivo financeiro com prazo e valor alvo.
```typescript
interface Meta {
  id: string;
  name: string;
  targetAmount: number;           // Valor alvo
  currentAmount: number;          // Valor acumulado
  deadline: string;               // ISO string
  icon: string;
  color: string;
  createdAt: string;
}
```

#### `MonthData`
Dados completos de um mês específico.
```typescript
interface MonthData {
  id: string;                     // Format: "YYYY-MM"
  income: number;                 // Receita mensal
  caixas: Caixa[];
  metas: Meta[];
  createdAt: string;
}
```

---

## 🎯 Funcionalidades Principais

### 1. Onboarding
- Tela inicial premium com fundo hexagonal
- Input de receita mensal com validação
- Inicialização automática do mês atual
- Animações suaves de entrada

### 2. Dashboard
**Métricas Exibidas:**
- Receita do mês
- Total distribuído
- Total restante (orçamento base zero)
- Percentual de investimento
- Percentual de consumo
- Score financeiro (0-100)

**Visualizações:**
- Gráfico de pizza (distribuição por caixa)
- Gráfico de barras (alocado vs gasto)
- Barra de progresso do score
- Cards animados de métricas

### 3. Sistema de Caixas
**Operações:**
- ✅ Criar caixa com nome, valor alocado e categoria
- ✅ Visualizar saldo, gasto e progresso
- ✅ Adicionar transações (despesas)
- ✅ Deletar transações
- ✅ Deletar caixa
- ✅ Barra de progresso visual

**Categorias:**
- Essencial (🏠)
- Investimento (📈)
- Lazer (🎯)
- Reserva (🛡️)
- Outro (📦)

### 4. Sistema de Metas
**Operações:**
- ✅ Criar meta com valor alvo e prazo
- ✅ Adicionar valor à meta
- ✅ Visualizar progresso com barra animada
- ✅ Ver dias restantes até o prazo
- ✅ Deletar meta

### 5. Histórico Mensal
**Funcionalidades:**
- ✅ Visualizar dados de meses anteriores
- ✅ Comparação mês a mês
- ✅ Estatísticas agregadas (receita total, média mensal)
- ✅ Detalhes do mês atual
- ✅ Evolução patrimonial

### 6. Exportação de Dados
**Formatos Suportados:**
- **CSV:** Tabela com caixas, transações e metas
- **PDF:** Relatório formatado com gráficos e resumo

---

## 📊 Lógica de Cálculo

### Score Financeiro (0-100)
Composto por três dimensões:

1. **Alocação Disciplinada (40%):** Quanto do orçamento foi alocado
   - 100% alocado = 40 pontos

2. **Investimento (30%):** Percentual destinado a investimento/reserva
   - 30% em investimento = 30 pontos (máximo)

3. **Disciplina de Gastos (30%):** Quão próximo o gasto ficou da alocação
   - Sem desvios = 30 pontos

**Fórmula:**
```
Score = (alocação/receita × 40) + (investimento/0.3 × 30) + (disciplina × 30)
Score = min(Score, 100)
```

### Percentuais de Distribuição
- **Investimento:** Soma de caixas com categoria "investimento" ou "reserva"
- **Consumo:** Soma de caixas com categoria "essencial", "lazer" ou "outro"

---

## 💾 Persistência de Dados

### LocalStorage
Todos os dados são salvos automaticamente em LocalStorage com a chave `nexo-finance-storage`.

**Estrutura:**
```json
{
  "currentMonthId": "2026-03",
  "months": {
    "2026-03": {
      "id": "2026-03",
      "income": 5000,
      "caixas": [...],
      "metas": [...],
      "createdAt": "2026-03-01T..."
    }
  },
  "hasOnboarded": true
}
```

### Backup
Os dados persistem entre sessões. Para backup manual, exporte em CSV ou PDF.

---

## 🚀 Como Usar

### Primeira Execução
1. Abra o aplicativo
2. Informe sua receita mensal
3. Clique em "→" para confirmar
4. Será redirecionado ao Dashboard

### Fluxo Típico
1. **Dashboard:** Visualize suas métricas e score
2. **Caixas:** Crie caixas e distribua seu orçamento (100% total)
3. **Metas:** Defina objetivos financeiros
4. **Histórico:** Acompanhe sua evolução mensal
5. **Exportar:** Baixe relatórios em CSV ou PDF

### Navegação
- Use a **Sidebar** esquerda para mudar de seção
- Selecione o mês no dropdown da sidebar
- Clique em "Exportar Dados" para gerar relatórios

---

## 🔧 Desenvolvimento

### Instalar Dependências
```bash
pnpm install
```

### Iniciar Servidor de Desenvolvimento
```bash
pnpm run dev
```
Acesse em `http://localhost:3000`

### Build para Produção
```bash
pnpm run build
```

### Type Check
```bash
pnpm run check
```

### Formatação de Código
```bash
pnpm run format
```

---

## 📱 Responsividade

O aplicativo é **totalmente responsivo**:
- **Mobile:** Stack vertical, sidebar colapsável
- **Tablet:** Layout adaptativo com grid 2 colunas
- **Desktop:** Layout completo com sidebar fixa

---

## 🎯 Roadmap Futuro

### Fase 2 (Backend)
- [ ] Autenticação com Manus OAuth
- [ ] Sincronização em nuvem
- [ ] Banco de dados PostgreSQL
- [ ] Multiusuário

### Fase 3 (Recursos Avançados)
- [ ] Integração bancária (Open Banking)
- [ ] Alertas e notificações
- [ ] Análise de tendências com IA
- [ ] Recomendações de economia
- [ ] Integração com apps de investimento

### Fase 4 (Monetização)
- [ ] Plano Premium com análises avançadas
- [ ] Consultoria financeira integrada
- [ ] API para integração com outras plataformas
- [ ] White-label para instituições financeiras

---

## 💡 Diferenciais Estratégicos

✅ **Design Premium:** Não parece planilha, parece banco digital
✅ **Orçamento Base Zero:** Força disciplina financeira
✅ **Score Financeiro:** Gamificação da saúde financeira
✅ **Histórico Completo:** Acompanhe evolução patrimonial
✅ **Exportação Fácil:** CSV e PDF com um clique
✅ **Offline First:** Funciona sem internet (dados em LocalStorage)
✅ **Tipografia Premium:** Space Grotesk + JetBrains Mono
✅ **Animações Suaves:** Transições calculadas e elegantes

---

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através da plataforma Manus.

---

## 📄 Licença

NEXO é um projeto proprietário desenvolvido pela equipe Manus.

---

**Versão:** 1.0.0  
**Data:** Março de 2026  
**Status:** ✅ Pronto para Produção
