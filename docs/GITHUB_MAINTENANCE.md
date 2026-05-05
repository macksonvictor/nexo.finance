# Operação do GitHub do NEXO Finance

Este arquivo é o ponto de partida para manter o repositório organizado, seguro e fácil de evoluir.

## Estado Atual

- `stable` é a base oficial do produto.
- `codex/*` são branches de trabalho.
- Pull requests devem entrar em `stable`.
- `.env` nunca deve ser commitado.
- Conta, pagamento, dados pessoais e segurança não devem virar issue pública.

## Issues

Use issues para trabalho público, seguro e sem dados sensíveis.

Categorias recomendadas:

- `bug`: erro reproduzível no app.
- `support: bug`: bug criado pelo suporte IA, já sanitizado.
- `support: suggestion`: sugestão criada pelo suporte IA.
- `type: roadmap`: tarefa estratégica ou pendência de produto.
- `status: needs-triage`: precisa de leitura e decisão.
- `status: verified`: validado ou concluído.

Quando fechar:

- Feche issue de teste depois que o fluxo foi validado.
- Feche roadmap só quando a mudança entrou em `stable`.
- Não feche alertas de produção antes de testar no ambiente final.

## Pull Requests

Fluxo recomendado:

1. Abrir PR contra `stable`.
2. Rodar CI.
3. Revisar `Files changed`.
4. Verificar se `.env` ou segredos não entraram.
5. Fazer merge apenas com checks verdes.

Para Dependabot:

- Priorize o PR agrupado quando ele cobrir várias dependências.
- Rode `pnpm check`, `pnpm test`, `pnpm build` e `pnpm audit`.
- Depois do merge do agrupado, feche PRs menores que ficaram redundantes.

## Tags E Releases

Use tags para marcar checkpoints reais do produto.

Sugestão:

- `v0.9.0`: fundação de suporte IA, GitHub automation e governança inicial.
- `v1.0.0`: app pronto para produção com domínio, Clerk, Stripe, banco e suporte validado.

Criação local:

```bash
git checkout stable
git pull origin stable
git tag -a v0.9.0 -m "NEXO support foundation"
git push origin v0.9.0
```

## Projects, Wiki E Documentação

O GitHub Project `NEXO Finance — Product Roadmap` deve continuar como quadro de execução.

Use:

- `Projects`: tarefas, status e próximos passos.
- `docs/`: guias versionados junto do código.
- `Wiki`: opcional no futuro, se a documentação pública crescer demais.

Por enquanto, a melhor fonte de verdade é o diretório `docs/`, porque passa por PR e acompanha a evolução do app.

## Proteção Da Branch Stable

A regra de proteção em `stable` já pode existir mesmo se o GitHub mostrar `Not enforced` em repositório privado gratuito.

Configuração recomendada:

- exigir pull request antes de merge.
- exigir status checks.
- impedir force push.
- impedir delete da branch.

Se a proteção precisar ser aplicada de verdade em repo privado, o caminho é GitHub Team/Enterprise ou tornar o repositório público quando fizer sentido.

## Segurança E Dependabot

Arquivos importantes:

- `SECURITY.md`
- `.github/dependabot.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/*`

Comandos úteis:

```bash
pnpm audit
pnpm outdated
pnpm check
pnpm test
pnpm build
```

Prioridade atual de segurança:

1. Validar e mergear o PR agrupado do Dependabot.
2. Resolver alertas críticos de `@clerk/shared` e `jspdf`/`dompurify`.
3. Resolver alertas altos de `vite`, `rollup`, `pnpm`, `tar` e `axios`.
4. Rodar o app e conferir login, checkout, suporte IA e exportação.

## Suporte IA E Issues

O suporte IA pode criar issue automaticamente apenas para:

- bug técnico público.
- sugestão pública.

Não deve criar issue pública para:

- conta.
- pagamento.
- segurança.
- dados pessoais.
- prints com informação sensível.

Esses casos devem acionar o canal privado configurado por `OWNER_NOTIFICATION_WEBHOOK_URL`.
