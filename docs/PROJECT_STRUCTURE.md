# Estrutura do projeto NEXO

Este documento define onde cada coisa deve viver no repositório para evitar bagunça local e mudanças acidentais em arquivos sensíveis.

## Pasta oficial do app

O projeto principal fica em:

```text
C:\END0-SYM\project\nexo project\nexo
```

Tudo que for mudança real do app deve acontecer dentro dessa pasta.

## Pastas principais

| Pasta | Uso |
| --- | --- |
| `client/` | Interface React, telas, componentes, assets e experiência do app. |
| `server/` | Express, tRPC, Stripe, Clerk, suporte IA, banco e regras backend. |
| `shared/` | Tipos e conhecimento compartilhado entre front/back, como suporte e contexto. |
| `drizzle/` | Schema e migrations do banco atual. |
| `services/nexo-ai-python/` | Microserviço Python/FastAPI opcional da NEXO IA. |
| `docs/` | Guias de manutenção, handoff, GitHub, deploy, segurança e roadmap técnico. |
| `.github/` | Workflows, templates de issue/PR, CODEOWNERS e Dependabot. |
| `patches/` | Patches de dependências mantidos pelo pnpm. |
| `tests/` | Testes auxiliares fora das pastas principais, quando necessário. |

## Arquivos que não devem ser tocados sem autorização

| Arquivo | Regra |
| --- | --- |
| `.env` | Somente o dono do projeto edita. Não abrir, não limpar, não commitar. |
| `.env.local` e variações | Mesma regra do `.env`. |
| Arquivos com chaves, tokens ou URLs privadas | Nunca entram no GitHub. Documentar apenas placeholders em `.env.example`. |

Se uma variável nova for necessária, o fluxo correto é:

1. Atualizar `.env.example` com um placeholder seguro.
2. Documentar a variável no guia relevante.
3. Informar ao dono o nome exato da variável.
4. O dono coloca o valor real no `.env`.

## Pastas e arquivos gerados localmente

Estas coisas podem aparecer durante desenvolvimento e não devem ser confundidas com código do produto:

| Item | O que é |
| --- | --- |
| `node_modules/` | Dependências locais do Node. |
| `dist/` | Build gerado por `pnpm build`. |
| `.pytest_cache/` | Cache de testes Python. |
| `.codex-logs/` e `.codex-runtime/` | Arquivos locais de execução/diagnóstico do Codex. |
| `tmp/` e `temp/` | Temporários locais. |
| `*.log` | Logs de dev, preview, Railway ou testes locais. |

Esses itens já devem ser ignorados pelo Git. Eles podem deixar a pasta visualmente cheia, mas não fazem parte do produto.

## Limpeza segura

Antes de apagar ou mover qualquer coisa:

1. Rodar `git status -sb`.
2. Conferir se não há alteração útil perdida.
3. Nunca apagar `.env`.
4. Nunca apagar arquivos dentro de `client/`, `server/`, `shared/`, `drizzle/`, `services/`, `docs/` ou `.github/` sem revisar.
5. Preferir limpar apenas caches, logs e builds gerados.

Comandos úteis para validar depois de uma limpeza:

```bash
pnpm check
pnpm test
pnpm build
```

## Organização recomendada para próximas fases

- Produto/UI: alterar `client/`.
- Backend/API: alterar `server/`.
- Banco: alterar `drizzle/` com migrations.
- IA Python: alterar `services/nexo-ai-python/`.
- Documentação operacional: alterar `docs/`.
- GitHub/CI: alterar `.github/`.

Se uma mudança atravessar muitas áreas ao mesmo tempo, abrir PR separado ou documentar claramente no PR.
