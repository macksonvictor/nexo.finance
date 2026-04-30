# NEXO Handoff Guide

Este guia e o mapa pratico para voce e outros programadores rodarem, manterem e
evoluirem o NEXO sem depender de memoria da conversa.

## 1. Visao Rapida

O NEXO e um app financeiro pessoal com:

- Frontend React 19 + Vite + TypeScript.
- Backend Express + tRPC.
- Banco MySQL com Drizzle ORM.
- Autenticacao via Clerk.
- Planos/pagamentos preparados para Stripe.
- IA principal via API compativel com OpenAI.
- Microservico Python opcional para analises financeiras mais pesadas.
- Mascote Rive-ready, aguardando o arquivo final `nexo-mascot.riv`.

Branch atual de trabalho:

```txt
codex/nexo-phase9-python-foundation
```

PR atual:

```txt
https://github.com/macksongaspar/nexo.finance/pull/4
```

## 2. Como Rodar Perfeitamente

### Windows: app principal

```powershell
cd "C:\END0-SYM\project\nexo project\nexo"
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Acesse:

```txt
http://localhost:3000
```

### WSL: Python IA

Use WSL + Python 3.12. Evite Python 3.14 no Windows puro para este servico,
porque pandas/numpy/scikit-learn podem falhar por DLL nativa.

```bash
cd /mnt/c/END0-SYM/project/nexo\ project/nexo/services/nexo-ai-python
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Se o app principal estiver no Windows e o Python no WSL, descubra o IP do WSL:

```bash
hostname -I
```

Depois ajuste no `.env` do app principal:

```env
PY_AI_BASE_URL=http://IP_DO_WSL:8001
```

## 3. Variaveis Importantes

Arquivo base:

```txt
.env.example
```

Minimo para rodar app + login:

```env
DATABASE_URL=mysql://user:password@host:port/database
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
APP_URL=http://localhost:3000
OWNER_USER_ID=user_...
```

IA principal:

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
```

IA Python opcional:

```env
PY_AI_ENABLED=false
PY_AI_BASE_URL=http://127.0.0.1:8001
PY_AI_TIMEOUT_MS=2500
PY_AI_SHADOW_MODE=false
PY_AI_ENABLE_PROPHET=false
```

Stripe:

```env
STRIPE_SECRET_KEY=...
STRIPE_PREMIUM_PRICE_ID=...
STRIPE_PRO_PRICE_ID=...
STRIPE_ELITE_PRICE_ID=...
# Alternativa simples para Stripe Payment Links no frontend
VITE_STRIPE_PREMIUM_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_ELITE_PAYMENT_LINK=https://buy.stripe.com/...
```

Segredos locais:

- O arquivo `.env` e a fonte de verdade local e nao deve ir para o GitHub.
- O inventario privado local fica em `docs/NEXO_PRIVATE_SECRETS_LOCAL.md`.
- Esse inventario esta ignorado no Git e nao deve ser incluido em PR.
- Se qualquer chave aparecer em print, log ou conversa publica, rotacione antes de producao.

## 4. Checklist De Validacao

Antes de commitar:

```powershell
pnpm check
pnpm test
pnpm build
```

Para Python, rode no WSL com Python 3.12:

```bash
source services/nexo-ai-python/.venv/bin/activate
pnpm check:py
pnpm test:py
```

Validar endpoints Python:

```bash
curl http://127.0.0.1:8001/health
curl -X POST http://127.0.0.1:8001/analyze/patterns -H "Content-Type: application/json" -d @payload.json
curl -X POST http://127.0.0.1:8001/risk/score -H "Content-Type: application/json" -d @payload.json
curl -X POST http://127.0.0.1:8001/predict/spending -H "Content-Type: application/json" -d @payload.json
```

Primeira ativacao da IA Python no app:

```env
PY_AI_ENABLED=true
PY_AI_SHADOW_MODE=true
```

So depois de validar logs e respostas, usar:

```env
PY_AI_SHADOW_MODE=false
```

## 5. Onde Mexer No App

Shell principal, janelas, sidebar, IA e rotas visuais:

```txt
client/src/pages/Home.tsx
```

Sidebar:

```txt
client/src/components/Sidebar.tsx
client/src/assets/lottie/
client/src/lib/lottieAnimations.ts
```

Header e menus:

```txt
client/src/components/DesktopHeader.tsx
client/src/components/MobileHeader.tsx
client/src/components/AccountMenuPanel.tsx
client/src/components/NotificationBell.tsx
```

Views principais:

```txt
client/src/components/DashboardView.tsx
client/src/components/CaixasView.tsx
client/src/components/MetasView.tsx
client/src/components/HistoricoView.tsx
client/src/components/RelatoriosView.tsx
client/src/components/IndicadoresView.tsx
client/src/components/OpenBankingView.tsx
client/src/components/PlanosView.tsx
```

Design system e contraste:

```txt
client/src/index.css
client/src/components/NexoAIView.css
```

Estado financeiro local:

```txt
client/src/stores/useFinanceStore.ts
client/src/types/finance.ts
```

## 6. Onde Mexer Na IA

Interface da IA:

```txt
client/src/components/NexoAIView.tsx
client/src/components/NexoAIView.css
client/src/components/NexoAILoader.tsx
```

Mascote e Rive:

```txt
client/src/components/NexoRiveMascot.tsx
client/src/components/NexoRiveMascotCanvas.tsx
client/src/lib/nexoAIMotion.ts
client/public/rive/README.md
```

Backend da IA:

```txt
server/ai.ts
server/routers.ts
server/_core/pythonAi.ts
server/_core/env.ts
```

Microservico Python:

```txt
services/nexo-ai-python/app/main.py
services/nexo-ai-python/app/routes/
services/nexo-ai-python/app/services/
services/nexo-ai-python/tests/
```

## 7. Suporte NEXO

A central de suporte deve seguir a regra de produto limpo: poucos caminhos na
tela inicial, coleções temáticas e artigos completos quando o usuário escolher
um assunto. O comportamento de clicar fora para fechar vale para o widget e
painéis do suporte, sem alterar o fechamento global do restante do app.

Arquivos principais:

```txt
client/src/pages/SupportPage.tsx
client/src/components/SupportWidget.tsx
client/src/lib/supportProvider.ts
client/src/data/supportArticles.ts
shared/supportKnowledge.ts
server/support.ts
server/_core/githubSupport.ts
server/_core/notification.ts
client/src/constants/team.ts
.github/ISSUE_TEMPLATE/
```

Regras atuais:

- A home de `/suporte` mostra busca e coleções; não despeja todos os artigos na
  primeira tela.
- Ao clicar em uma coleção, a página troca para a lista daquela coleção, no
  estilo help center da Manus.
- O widget começa como `NEXO Suporte IA`, cumprimenta pelo nome quando houver
  usuário logado e responde com base nos artigos locais.
- O widget tem abas `Início`, conversa ativa e `Mensagens`; mensagens antigas
  não são despejadas quando o usuário inicia uma nova conversa.
- Bug técnico e sugestão podem abrir issue sanitizada no GitHub quando
  `GITHUB_TOKEN` e `GITHUB_SUPPORT_REPO` estiverem configurados.
- Conta, pagamento, cobrança, dados financeiros, e-mail, telefone, chaves e
  prints sensíveis nunca devem ir para GitHub público.
- WhatsApp e Gmail pessoais não devem aparecer na interface pública.
- Alertas internos usam `OWNER_NOTIFICATION_WEBHOOK_URL`, que pode receber uma
  URL JSON comum ou uma lista de URLs separadas por vírgula, incluindo CallMeBot
  já completo no `.env`.
- Upload de imagens/anexos no suporte ainda não está ativo. Quando entrar,
  usar storage privado, limite de tamanho, validação de tipo de arquivo e nunca
  enviar anexos sensíveis para issue pública.

Variáveis úteis:

```env
OWNER_NOTIFICATION_WEBHOOK_URL=
GITHUB_TOKEN=
GITHUB_SUPPORT_REPO=
GITHUB_SUPPORT_LABEL_BUG=bug
GITHUB_SUPPORT_LABEL_SUGGESTION=sugestao
```

Status importante:

- O plugin GitHub usado pelo Codex ajuda a mexer no repositório durante o
  desenvolvimento, mas o app rodando em produção não consegue usar essa sessão.
  Para criar issue automaticamente, o servidor precisa de `GITHUB_TOKEN` no
  ambiente.
- `GITHUB_TOKEN` deve ser um token fine-grained limitado ao repositório do NEXO,
  com permissão de `Issues: Read and write`.
- `GITHUB_SUPPORT_REPO` deve ficar no formato `owner/repo`.
- `OWNER_NOTIFICATION_WEBHOOK_URL` deve receber uma URL privada de webhook. Pode
  ser JSON comum ou URLs completas do CallMeBot separadas por vírgula para
  avisar mais de uma pessoa. Nunca colocar número, chave ou URL privada no
  código ou no GitHub.
- Se `GITHUB_TOKEN` estiver vazio, o suporte conversa, mas não cria issue.
- Se `OWNER_NOTIFICATION_WEBHOOK_URL` estiver vazio, o suporte conversa, mas não
  envia alerta interno/WhatsApp.
- Se os dois estiverem vazios, não aparecerá nada no GitHub nem no WhatsApp; a
  validação final deve sempre testar uma pergunta de bug real e conferir GitHub
  + alerta privado.

Suporte humano futuro:

- O caminho recomendado para atendimento humano profissional é Chatwoot.
- Chatwoot deve ser plugado depois por variáveis de ambiente/token de inbox,
  sem expor telefone pessoal.
- Intercom foi usado como referência visual porque a Manus usa Intercom no help
  center, mas não é a escolha inicial do NEXO por custo e dependência.
- Quando Chatwoot entrar, o provider deve encaminhar casos `private_support`
  para a inbox humana e manter GitHub somente para `github_bug` e
  `github_suggestion`.

## 8. Dominio, Clerk E Deploy

### Dominio

Quando o dominio oficial estiver pronto:

- Aponte DNS para o provedor de deploy final.
- Atualize `APP_URL` para o dominio publico.
- Atualize os dominios permitidos no Clerk.
- Atualize callbacks, redirects e allowed origins.
- Teste login, logout, refresh de sessao e deep links.

### Clerk

Conferir no painel do Clerk:

- Publishable key e secret key corretas por ambiente.
- Dominios autorizados: local, preview e producao.
- Redirect URLs para sign-in/sign-up.
- Webhook se for usado no futuro.
- `OWNER_USER_ID` do criador/admin.

### Railway

Configuracao atual:

```txt
Build: pnpm build
Start: pnpm start
```

Arquivos:

```txt
railway.json
Dockerfile
```

### Banco

Drizzle usa:

```txt
drizzle.config.ts
drizzle/schema.ts
```

Comando de migracao:

```powershell
pnpm db:push
```

Nunca rode migracao em producao sem backup do banco.

### Stripe

Antes de ligar cobranca real:

- Criar produtos e precos no Stripe.
- Preencher `STRIPE_*_PRICE_ID`.
- Preencher `STRIPE_SECRET_KEY` para checkout backend ou `VITE_STRIPE_*_PAYMENT_LINK` para redirecionamento simples por Payment Link.
- Validar checkout em modo test.
- Validar webhook antes de mover para live.
- Conferir fallback para usuario admin/criador.

## 9. Rive E Mascote

O app ja esta preparado para receber:

```txt
client/public/rive/nexo-mascot.riv
```

Contrato do arquivo:

```txt
State Machine: NexoMascot
Inputs:
- mood: number
- intensity: number
- hovered: boolean
- blink: trigger
```

Estados esperados:

```txt
0 idle
1 reading
2 processing
3 responding
4 alert
5 confident
6 curious
```

Direcao visual:

- Cubo limpo, sem aura, sem glow externo, sem particulas.
- Animar rosto, piscadas, boca e inclinacoes simples.
- Manter fundo transparente.
- Exportar `.riv`, colocar na pasta publica e ativar em `nexoAIMotion.ts`.

## 10. Padrao Para Melhorias Futuras

Quando mexer em UI:

- Conferir modo claro e modo escuro.
- Conferir desktop, notebook e mobile.
- Evitar texto branco em fundo claro e preto em fundo escuro.
- Usar tokens semanticos: `text-foreground`, `text-muted-foreground`,
  `bg-card`, `bg-secondary`, `border-border`.

Quando mexer em IA:

- Nao quebrar historico local.
- Nao apagar conversas ao abrir a IA oficial.
- A IA oficial deve abrir limpa; historico continua salvo.
- Atalhos `Perguntar a IA` devem manter contexto da tela.

Quando mexer em Python:

- Validar no WSL + Python 3.12.
- Manter respostas com schemas do `services/nexo-ai-python/app/schemas.py`.
- Primeiro ligar em shadow mode.
- So depois usar a resposta Python diretamente no prompt principal.

Quando mexer em suporte:

- Manter a pagina inicial limpa.
- Nao publicar contato pessoal.
- Nao transformar duvida privada em issue publica.
- Expandir artigos antes de criar novos botoes.
- Testar busca, colecao, artigo e widget no modo claro/escuro.

## 11. Checklist Antes De Entregar

- `pnpm check` passa.
- `pnpm test` passa.
- `pnpm build` passa.
- App abre em `http://localhost:3000`.
- Sidebar limpa em desktop e recolhida.
- Header nao quebra em notebook.
- Menu de perfil nao fica cortado.
- Nexo IA abre e fecha corretamente.
- Configuracoes da IA aparecem acima do chat e sem texto espremido.
- Dashboard/Relatorios/Indicadores vazios ficam legiveis e premium.
- Modo claro e modo escuro com contraste bom.
- Python validado no ambiente certo ou limitacao registrada.
- README e este guia atualizados quando houver mudanca grande.
