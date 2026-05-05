# Plano de migração para PostgreSQL

O PostgreSQL é a melhor direção para o NEXO Finance quando o app avançar para uma base mais robusta de produção. Ele combina bem com dados financeiros, relatórios, auditoria, integrações, analytics e futuras capacidades de IA.

## Estado atual

Hoje o projeto usa MySQL com Drizzle:

| Arquivo | Estado atual |
| --- | --- |
| `drizzle.config.ts` | `dialect: "mysql"` |
| `server/db.ts` | `drizzle-orm/mysql2` |
| `drizzle/schema.ts` | `mysqlTable`, `mysqlEnum` e tipos de `mysql-core` |
| `package.json` | Dependência `mysql2` |

Por isso, a migração não deve ser feita apenas trocando `DATABASE_URL`. Ela precisa de uma etapa controlada para evitar perda de dados e regressão.

## Por que PostgreSQL faz sentido

- Transações fortes para dados financeiros.
- Índices e consultas melhores para relatórios.
- JSONB para metadados de IA, suporte, bancos e integrações.
- Views/materialized views para dashboards futuros.
- Extensões úteis no futuro, como `pg_trgm`, `uuid-ossp` e possivelmente `pgvector`.
- Melhor caminho para provedores como Neon, Supabase, Railway Postgres ou Render Postgres.

## Opções recomendadas

| Provedor | Quando usar |
| --- | --- |
| Railway Postgres | Bom se o deploy principal já ficar no Railway. Simples para manter tudo no mesmo lugar. |
| Neon | Excelente para Postgres serverless, branches de banco e ambientes preview. |
| Supabase | Bom se quiser painel, Auth opcional, storage e SQL editor forte. |

Recomendação inicial: Railway Postgres se a prioridade for simplicidade operacional; Neon se a prioridade for fluxo profissional de staging/preview.

## Estratégia segura

1. Criar uma branch dedicada: `codex/postgres-migration-plan` ou similar.
2. Adicionar dependência Postgres sem remover MySQL imediatamente.
3. Criar schema Postgres paralelo ou converter o schema com cuidado.
4. Criar migrations novas em pasta separada ou reset controlado para staging.
5. Validar app com banco vazio em ambiente de teste.
6. Migrar dados reais apenas depois de backup/export.
7. Rodar validações completas.
8. Fazer deploy em staging.
9. Só depois virar produção.

## Mudanças técnicas esperadas

| Área | Mudança |
| --- | --- |
| Dependências | Adicionar `postgres` ou `pg`; depois remover `mysql2` quando a migração estiver concluída. |
| Drizzle config | Trocar `dialect` para `postgresql`. |
| Schema | Converter `mysqlTable` para `pgTable`, `mysqlEnum` para enum PostgreSQL ou text enum validado. |
| Driver | Trocar `drizzle-orm/mysql2` para `drizzle-orm/postgres-js` ou `drizzle-orm/node-postgres`. |
| Migrations | Gerar migrations novas e validar em banco de staging. |
| Deploy | Atualizar `DATABASE_URL` no provedor, nunca no GitHub. |

## Atenção com tipos de dados

- Dinheiro não deve depender de `double` no longo prazo. Preferir `numeric`/`decimal` ou inteiro em centavos.
- Datas devem ter padrão consistente entre app, banco e timezone.
- IDs podem continuar como strings, mas UUID nativo pode ser avaliado depois.
- Enums devem ser planejados para evoluir sem travar deploy.

## Checklist antes da migração real

- `stable` limpa e CI verde.
- PRs de Dependabot principais resolvidos.
- Backup dos dados atuais.
- Banco PostgreSQL criado em staging.
- `.env.example` atualizado apenas com placeholder.
- `.env` real atualizado manualmente pelo dono do projeto.
- `pnpm check`, `pnpm test` e `pnpm build` passando.
- Teste manual de login, dashboard, caixas, metas, histórico, relatórios, suporte e NEXO IA.

## Fora de escopo nesta fase

- Não migrar dados reais sem backup.
- Não editar `.env` automaticamente.
- Não trocar banco junto com grandes mudanças visuais.
- Não remover MySQL até o fluxo PostgreSQL estar validado.

## Decisão recomendada

Fechar primeiro GitHub, CI e Dependabot. Depois abrir uma branch exclusiva para PostgreSQL. A migração deve ser tratada como infraestrutura crítica, não como ajuste rápido.
