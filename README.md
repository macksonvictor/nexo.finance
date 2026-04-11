<p align="center">
  <img src="./docs/nexofinance.png" alt="NEXO Finance" width="220" />
</p>

# NEXO Finance

**Todo real recebe uma missao.**

NEXO e um aplicativo web premium de gestao financeira pessoal baseado em **Orcamento Base Zero**, criado para transformar receita, caixas, metas e historico em uma experiencia clara, elegante e acionavel.

[Guia rapido](#como-rodar-localmente) | [Suporte](#suporte) | [Documentacao](#documentacao)

---

## O Que e o NEXO?

NEXO foi pensado para quem quer organizar a vida financeira com mais disciplina e mais clareza visual.

Em vez de funcionar como um app generico de anotacoes de gasto, ele trabalha com uma regra simples e forte:

> cada real que entra precisa receber uma missao

Isso significa que a receita mensal e distribuida em caixas com funcao definida, acompanhada por metas e lida ao longo do tempo como comportamento, risco e progresso.

O objetivo nao e so registrar o que aconteceu. O objetivo e ajudar o usuario a decidir melhor.

---

## Funcionalidades Principais

### Dashboard Premium

- leitura de receita, distribuicao e gastos em tempo real
- score financeiro com visao sintetica da disciplina do mes
- indicadores de investimento, consumo e equilibrio
- graficos para acompanhamento rapido da situacao atual

### Sistema de Caixas

- criacao de caixas financeiras por categoria
- organizacao do dinheiro por prioridade
- acompanhamento de saldo, consumo e utilizacao
- apoio visual para entender onde o dinheiro esta indo

Categorias base:

- essencial
- investimento
- lazer
- reserva
- outro

### Metas Financeiras

- metas com valor alvo e prazo
- progresso acumulado ao longo do mes
- leitura simples de evolucao
- apoio para transformar intencao em acompanhamento real

### Historico Mensal

- visao dos meses anteriores
- comparacao da evolucao financeira
- leitura consolidada do que aconteceu em cada periodo
- base para mais clareza na tomada de decisao

### Exportacao de Dados

- exportacao em CSV
- geracao de PDF
- consolidacao de caixas, transacoes e metas

### NEXO IA

- chat financeiro dentro do app
- modos de leitura para diagnostico, risco, previsao e recomendacoes
- integracao com APIs compativeis com OpenAI
- configuracao pronta para uso com Groq

### Open Banking e Expansao

- base estrutural preparada para evolucao
- espaco para futuras integracoes bancarias
- terreno pronto para automacoes e leitura financeira mais avancada

---

## Diferenciais do Produto

- visual premium com direcao inspirada em sistemas de alta confianca
- logica de Orcamento Base Zero aplicada de forma pratica
- foco em clareza, disciplina e crescimento patrimonial
- arquitetura pronta para autenticacao, IA, pagamentos e deploy
- experiencia pensada para parecer produto de verdade, nao planilha com maquiagem

---

## Stack Tecnico

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite |
| Backend | Express + tRPC |
| Banco | MySQL |
| ORM | Drizzle ORM |
| Autenticacao | Clerk |
| Estado | Zustand |
| Animacoes | Framer Motion |
| Graficos | Recharts |
| Exportacao | jsPDF + jsPDF-AutoTable |
| IA | OpenAI-compatible API |
| Pagamentos | Stripe |
| Deploy tecnico | Railway |
| Portabilidade | Docker |

---

## Como Rodar Localmente

### 1. Entrar no projeto

```powershell
cd "C:\END0-SYM\project\nexo project\nexo"
```

### 2. Instalar dependencias

```powershell
pnpm install
```

### 3. Criar o arquivo de ambiente

```powershell
Copy-Item .env.example .env
```

### 4. Preencher as variaveis principais

Exemplo funcional para desenvolvimento local:

```env
DATABASE_URL=mysql://root:...@mainline.proxy.rlwy.net:42019/railway
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
APP_URL=http://localhost:3000
OWNER_USER_ID=user_...
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

### 5. Iniciar o ambiente

```powershell
pnpm dev
```

Depois, acesse:

```txt
http://localhost:3000
```

---

## Variaveis de Ambiente

### Obrigatorias

```env
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
```

### Recomendadas

```env
OWNER_USER_ID=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

### Opcionais

```env
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
OWNER_NOTIFICATION_WEBHOOK_URL=
STRIPE_SECRET_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=
```

Arquivo de referencia:

- [`.env.example`](./.env.example)

---

## Deploy Tecnico

Deploy tecnico atual:

- [wholesome-liberation-production.up.railway.app](https://wholesome-liberation-production.up.railway.app/)

Observacoes importantes:

- hoje esse link serve como ambiente tecnico de validacao
- para producao publica completa com Clerk, o caminho ideal continua sendo um dominio proprio
- para testes entre amigos e validacao de interface, a execucao local continua sendo a referencia mais segura

### Railway

Configuracao base:

```txt
Build: pnpm build
Start: pnpm start
```

### Docker

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

---

## Estrutura do Projeto

```txt
nexo/
|-- client/
|   `-- src/
|       |-- components/
|       |-- contexts/
|       |-- hooks/
|       |-- lib/
|       |-- pages/
|       |-- stores/
|       |-- types/
|       |-- _core/
|       |-- App.tsx
|       |-- const.ts
|       |-- index.css
|       `-- main.tsx
|-- server/
|   |-- _core/
|   |-- db.ts
|   |-- index.ts
|   `-- routers.ts
|-- drizzle/
|-- shared/
|-- tests/
|-- docs/
|-- .github/workflows/
|-- package.json
`-- README.md
```

---

## Comandos Disponiveis

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm test
pnpm format
```

Fluxo minimo de validacao:

```bash
pnpm check
pnpm test
pnpm build
```

---

## Responsividade

- mobile com leitura adaptada
- tablet com distribuicao intermediaria
- desktop com experiencia mais completa

---

## Roadmap

### Produto

- evoluir dashboard e leitura patrimonial
- refinar sistema de caixas, transacoes e metas
- aprofundar visualizacoes e relatorios

### NEXO IA

- ampliar analises e recomendacoes
- melhorar leitura contextual do mes
- fortalecer a camada conversacional do produto

### Plataforma

- amadurecer autenticacao e publicacao
- melhorar observabilidade e operacao
- evoluir integracoes, automacoes e monetizacao

---

## Documentacao

- [README.md](./README.md)
- [NEXO_DOCUMENTATION.md](./NEXO_DOCUMENTATION.md)
- [SUPPORT.md](./SUPPORT.md)
- [Dockerfile](./Dockerfile)

---

## Suporte

Canal atual:

- `macksongaspar@gmail.com`

Se precisar de ajuda, envie:

- e-mail da conta usada
- descricao objetiva do problema
- print ou video curto, se possivel
- horario aproximado e dispositivo usado

Detalhes:

- [SUPPORT.md](./SUPPORT.md)

---

## Autoria

NEXO Finance e um projeto autoral de **Mackson Gaspar**.

Apresentacao recomendada da marca:

```txt
Criado por Mackson Gaspar e Bruno Souto
Um projeto autoral Tesserakt
```

Essa formulacao preserva a verdade, fortalece a marca e nao inventa uma equipe que ainda nao existe.
---

## Licenca

Licenca atual do repositorio: `MIT`

---

**Versao atual:** 1.0.0  
**Branch principal:** `stable`  
**Status atual:** base ativa, README atualizado, CI configurado e ambiente local pronto para desenvolvimento
