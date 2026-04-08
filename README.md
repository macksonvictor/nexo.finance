# NEXO – Sistema de Gestão Financeira Pessoal

> **Todo real recebe uma missão.**

Um aplicativo web premium de gestão financeira pessoal baseado em **Orçamento Base Zero**, com foco em disciplina, crescimento patrimonial e design minimalista de luxo.

![NEXO Screenshot](./nexo-preview.png)

## 🎯 O Que é NEXO?

NEXO é uma solução completa para quem quer **controlar suas finanças com precisão e elegância**. Diferente de apps convencionais de gastos, NEXO implementa o conceito de **Orçamento Base Zero**, onde você distribui 100% da sua receita em caixas específicas, cada uma com uma missão definida.

### Conceito Central
Cada real que entra deve ser alocado a uma caixa (essencial, investimento, lazer, reserva). Não pode sobrar nem ultrapassar. Isso força disciplina e clareza total sobre aonde seu dinheiro vai.

## ✨ Funcionalidades Principais

### 📊 Dashboard Premium
- Visualização completa de receita, distribuição e gastos
- Score financeiro (0-100) que mede sua disciplina
- Gráficos de pizza e barras com dados em tempo real
- Métricas de investimento vs consumo

### 🏦 Sistema de Caixas
- Crie caixas para cada categoria (essencial, investimento, lazer, reserva)
- Aloque valores que somem exatamente sua receita
- Registre despesas e acompanhe o saldo em tempo real
- Visualize progresso com barras animadas

### 🎯 Metas Financeiras
- Defina objetivos com valor alvo e prazo
- Acumule valores nas metas
- Acompanhe progresso visual
- Receba alertas quando o prazo se aproxima

### 📅 Histórico Mensal
- Visualize dados de meses anteriores
- Compare mês a mês sua evolução
- Estatísticas agregadas de receita, gastos e poupança
- Relatório completo do mês atual

### 📥 Exportação de Dados
- Exporte em **CSV** para análise em planilhas
- Gere **PDF** com relatório formatado e profissional
- Dados completos de caixas, transações e metas

## 🎨 Design Premium

**Estilo:** Vault Architecture (Swiss Design + Private Banking UX)

- **Paleta:** Preto profundo, cinza aço, branco suave
- **Tipografia:** Space Grotesk (títulos) + JetBrains Mono (valores)
- **Animações:** Transições suaves e calculadas
- **Tema:** Dark mode premium (único tema)

## 🚀 Como Começar

### Instalação
```bash
# Clone ou acesse o projeto
cd nexo

# Instale dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm run dev
```

Acesse `http://localhost:3000` no seu navegador.

### Primeiro Uso
1. **Onboarding:** Informe sua receita mensal
2. **Dashboard:** Visualize suas métricas
3. **Caixas:** Crie caixas e distribua seu orçamento
4. **Metas:** Defina objetivos financeiros
5. **Acompanhamento:** Registre despesas e monitore progresso

## 📋 Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite |
| **Styling** | TailwindCSS 4 + Custom CSS |
| **State** | Zustand + LocalStorage |
| **Animações** | Framer Motion |
| **Gráficos** | Recharts |
| **Exportação** | jsPDF + jsPDF-AutoTable |
| **Tipografia** | Google Fonts (Space Grotesk, JetBrains Mono) |

## 📁 Estrutura do Projeto

```
nexo/
├── client/
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/            # Páginas (Home, NotFound)
│   │   ├── stores/           # Zustand store
│   │   ├── lib/              # Utilitários e serviços
│   │   ├── types/            # Tipos TypeScript
│   │   ├── contexts/         # React contexts
│   │   ├── App.tsx           # Componente raiz
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Estilos globais
│   ├── index.html
│   └── public/
├── package.json
└── README.md
```

## 🧠 Lógica de Cálculo

### Score Financeiro (0-100)
Mede sua disciplina financeira em três dimensões:

- **Alocação (40%):** Quanto do orçamento você distribuiu
- **Investimento (30%):** Percentual em investimento/reserva
- **Disciplina (30%):** Quão próximo o gasto ficou da alocação

### Exemplo
Se você tem R$ 5.000 de receita:
- Aloca R$ 5.000 em caixas = 40 pontos
- Investe R$ 1.500 (30%) = 30 pontos
- Gasta exatamente o alocado = 30 pontos
- **Score Final:** 100 (excelente!)

## 💾 Dados & Privacidade

- **Armazenamento:** LocalStorage (seu navegador)
- **Sincronização:** Nenhuma (dados locais apenas)
- **Backup:** Exporte em CSV/PDF regularmente
- **Privacidade:** Seus dados nunca saem do seu navegador

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
pnpm run dev          # Inicia servidor com hot reload

# Build
pnpm run build        # Build para produção
pnpm run preview      # Preview do build

# Qualidade
pnpm run check        # Type check com TypeScript
pnpm run format       # Formata código com Prettier
```

## 📱 Responsividade

- ✅ **Mobile:** Layout vertical otimizado
- ✅ **Tablet:** Grid adaptativo
- ✅ **Desktop:** Layout completo com sidebar

## 🎯 Roadmap

### Fase 2 (Backend)
- Autenticação com OAuth
- Sincronização em nuvem
- Banco de dados PostgreSQL
- Multiusuário

### Fase 3 (Recursos Avançados)
- Integração bancária
- Alertas e notificações
- Análise com IA
- Recomendações de economia

### Fase 4 (Monetização)
- Plano Premium
- Consultoria financeira
- API para integrações
- White-label

## 📚 Documentação Completa

Veja [NEXO_DOCUMENTATION.md](./NEXO_DOCUMENTATION.md) para:
- Arquitetura técnica detalhada
- Modelo de dados completo
- Guia de desenvolvimento
- Especificações de design

## 🤝 Contribuindo

Este é um projeto proprietário. Para sugestões, entre em contato através da plataforma Manus.

## 📄 Licença

NEXO © 2026 Manus. Todos os direitos reservados.

---

## 💡 Dicas de Uso

### Orçamento Base Zero
1. Anote sua receita mensal
2. Crie caixas para cada categoria
3. Distribua 100% da receita entre as caixas
4. Não deixe sobras (força disciplina)

### Categorias Recomendadas
- **Essencial:** Moradia, alimentação, transporte
- **Investimento:** Poupança, investimentos, previdência
- **Lazer:** Entretenimento, viagens, hobbies
- **Reserva:** Emergências, fundo de segurança
- **Outro:** Categorias customizadas

### Acompanhamento
- Registre despesas no dia a dia
- Monitore o score financeiro
- Revise metas mensalmente
- Exporte relatórios para análise

---

**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção  
**Última Atualização:** Março de 2026

Desenvolvido com ❤️ pela equipe Manus
