# Política de Segurança do NEXO Finance

## Versões Suportadas

O desenvolvimento ativo acontece na branch `stable`. Correções de segurança devem partir de `stable` e entrar por pull request.

| Linha | Status |
| --- | --- |
| `stable` | Suportada |
| branches `codex/*` | Trabalho em andamento |
| demais branches | Sem garantia de suporte |

## Como Reportar Uma Vulnerabilidade

Não abra issue pública com senhas, tokens, chaves, e-mails, telefone, dados financeiros, prints de conta ou qualquer dado sensível.

Use um destes caminhos:

- Central de suporte dentro do app NEXO, quando disponível.
- GitHub Security Advisory privado, se a opção estiver habilitada no repositório.
- Canal interno configurado por `OWNER_NOTIFICATION_WEBHOOK_URL`, quando o relato vier pelo suporte IA.

Para bugs públicos sem dados sensíveis, use o template `Bug no NEXO`.

## O Que Incluir No Relato

- Área afetada: login, pagamento, IA, suporte, dados, dashboard ou outra.
- Passos para reproduzir.
- Impacto esperado.
- Navegador, sistema e horário aproximado.
- Prints apenas se não contiverem dados sensíveis.

## SLA Inicial

Este projeto ainda está em fase de fundação. A triagem inicial deve seguir esta ordem:

- Crítico: possível vazamento de dados, acesso indevido, pagamento ou chave exposta.
- Alto: quebra de login, checkout, suporte, banco de dados ou IA em produção.
- Médio: falha funcional com contorno claro.
- Baixo: melhoria, ajuste visual ou texto.

## Dependências

Alertas do Dependabot devem ser tratados por PR, com validação mínima:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm audit
```

Quando houver um PR agrupado do Dependabot, valide primeiro o agrupado. PRs menores que forem cobertos pelo agrupado podem ser fechados depois do merge.
