# NEXO – TODO

## Fase 1 (Concluída)
- [x] Dashboard com métricas financeiras
- [x] Sistema de Caixas (criar, editar, excluir)
- [x] Sistema de Metas com progresso
- [x] Histórico mensal
- [x] Exportação CSV/PDF
- [x] Tela de Splash premium
- [x] Editar receita (modal + sidebar)
- [x] Modal de confirmação de exclusão
- [x] Editar metas após criação
- [x] Backend Express + tRPC
- [x] Banco de dados MySQL (5 tabelas)
- [x] Autenticação OAuth Manus
- [x] Tela de login premium
- [x] Botão de logout com avatar na sidebar

## Fase 2 – Funcionalidades Bancárias (Concluída)
- [x] Transferências entre caixas (com registro de transação)
- [x] Histórico de transações sincronizado com backend
- [x] Relatórios detalhados (por categoria, período, evolução)
- [x] Backup automático de dados (snapshot mensal)
- [x] Exportação PDF avançada com gráficos e análises
- [ ] Notificação de caixa no limite (roadmap futuro)
- [ ] Score financeiro calculado no backend (roadmap futuro)

## Fase 3 – Integração com Instituições Financeiras (Concluída)
- [x] Tela de conexão com bancos (Open Banking simulado)
- [x] Importação de extratos CSV (OFX/CSV bancário)
- [x] Categorização automática de transações
- [x] Sincronização de saldo em tempo real (simulado)
- [ ] Mapeamento de transações para caixas (roadmap futuro)

## Fase 4 – Monetização (Concluída)
- [x] Schema de planos no banco (free/premium)
- [x] Lógica de limite: plano gratuito até 5 caixas
- [x] Página de upgrade premium com comparativo detalhado
- [x] Integração com Stripe (preparado para produção)
- [x] Página de billing/assinatura
- [x] Badge "Premium" na sidebar
- [x] Proteção de features premium no backend

## Notificações Push
- [x] Lógica de verificação de metas próximas do vencimento no backend
- [x] Tabela de notificações no banco de dados
- [x] Endpoint tRPC para listar e marcar notificações como lidas
- [x] Sino de notificações na Sidebar com badge de contagem
- [x] Painel de notificações com lista de alertas
- [x] Toast automático ao entrar no app se houver metas vencendo
- [x] Notificação ao dono via sistema Manus (notifyOwner)

## IA Nexo – Assistente Financeiro Inteligente
- [x] Animação de loading estilo Grok (logo NEXO pulsante com glow)
- [x] Backend: análise de padrões financeiros com LLM
- [x] Backend: detector de sabotagem financeira
- [x] Backend: simulador de futuro financeiro ("E se...?")
- [x] Backend: recomendações automáticas de alocação
- [x] Backend: análise de risco oculto
- [x] Chat da IA com streaming de resposta
- [x] Painel de insights com indicadores inteligentes
- [x] Integração da IA nos relatórios PDF

## Sistema de Planos v2
- [ ] Plano Free: até 5 caixas, sem IA, sem exportação
- [ ] Plano Premium: ilimitado + IA básica, R$ 19,90/mês
- [ ] Plano Pro: ilimitado + IA Preditiva + Open Banking, R$ 49,90/mês
- [ ] Plano Elite: tudo + Consultoria + Alertas prioritários, R$ 99,90/mês
- [ ] Renomear "IA Nexo" para "Nexo" na sidebar e interface
- [ ] Restringir exportação no plano Free
- [ ] Restringir IA no plano Free
- [ ] IA básica no Premium, IA Preditiva completa no Pro/Elite

## Módulos IA Avançados
- [ ] IA.1 – Análise automática de padrão financeiro (perfil comportamental)
- [ ] IA.2 – Detector de sabotagem financeira com relatório mensal
- [ ] IA.3 – Índice de Vulnerabilidade Financeira (0-100)
- [ ] IA.4 – Probabilidade de ficar sem dinheiro no mês (modelo preditivo)
- [ ] IA.5 – Simulador de futuro financeiro (6 meses, 1 ano, 5 anos)
- [ ] IA.6 – Impacto real de cada gasto (feedback em tempo real)
- [ ] IA.7 – Indicadores inteligentes (Disciplina, Risco, Consistência, Crescimento)

## Aprimoramentos Plano Maestro v2
- [ ] Rate limiting (proteção brute force)
- [ ] CORS seguro configurado
- [ ] Soft deletes (deletar sem perder dados)
- [ ] Paywall real: Free limita 5 caixas, sem IA, sem exportação
- [ ] Paywall: Premium sem Open Banking e sem relatórios avançados
- [ ] Painel de indicadores financeiros avançados
- [ ] Índice de Consistência (0-100)
- [ ] Score de Crescimento Patrimonial (0-100)
- [ ] Gráficos de evolução dos indicadores
- [ ] Recomendações baseadas em indicadores

## Painel do Criador (Admin)
- [x] macksongaspar@gmail.com recebe plano Elite automático e permanente no backend
- [x] Rota tRPC retorna role do usuário (admin vs user) baseado no email
- [x] Frontend reconhece admin e libera todas as features sem paywall
- [x] Badge "Criador" na sidebar para admin
- [x] Usuários normais continuam com restrições por plano

## Correções e Melhorias v4.4
- [x] Corrigir erro de transferência entre caixas
- [x] Adicionar logos reais dos bancos brasileiros no Open Banking
- [x] Implementar datas dinâmicas: meses de jan/2024 até dez do ano atual sempre atualizados
- [ ] Explicar integração Open Banking real para o usuário

## Estilo 3D / Neumórfico Dark
- [x] Sistema de sombras 3D e variáveis CSS de profundidade (dark neumorphism)
- [x] Cards do Dashboard com efeito de profundidade e levitação
- [x] Sidebar com efeito 3D
- [x] Cards das Caixas com profundidade
- [x] Modais e outros componentes com estilo 3D

## Integração Stripe (v4.7)
- [x] Adicionar feature Stripe com webdev_add_feature
- [x] Configurar chaves Stripe (public e secret) via webdev_request_secrets
- [x] Criar produtos e preços no Stripe (Premium R$19.90, Pro R$49.90, Elite R$99.90)
- [x] Atualizar schema: tabela subscriptions com stripe_subscription_id, status, current_period_end
- [x] Implementar checkout session (redirect para Stripe Checkout)
- [x] Configurar IDs de preços do Stripe (price_ids)
- [x] Testes de configuração do Stripe passando
- [x] Botões de upgrade no PlanosView redirecionam para Stripe Checkout (CORRIGIDO: handleUpgrade agora chama tRPC e redireciona com window.location.href)
- [ ] Implementar webhook para atualizar status de assinatura
- [ ] Criar portal de gerenciamento de assinatura (cancelar, atualizar cartão)
- [ ] Sincronizar status de assinatura com plano do usuário


## Mobile Extremo v5.0 (Concluído)
- [x] Adicionar animações de carregamento profissionais (skeleton loaders)
- [x] Corrigir elementos que aparecem pela metade no campo de IA
- [x] Corrigir elementos que aparecem pela metade na página de Planos
- [x] Otimizar scroll e overflow em mobile
- [x] Adicionar loading states com animações
- [x] Melhorar height/min-height em componentes
- [x] Adicionar suporte a safe-area-inset (notch em iPhone)
- [x] Testar em landscape mode completamente


## Mobile Header Profissional v5.1 (Concluído)
- [x] Corrigir bug de notificação mobile
- [x] Criar header mobile estilo Manus 1.6 Lite
- [x] Adicionar ícone IA Nexo no header (sem emoji)
- [x] Adicionar ícone notificação no header
- [x] Adicionar avatar/perfil no header
- [x] Menu hamburger mantém funcionamento
- [x] Testar responsividade completa
- [ ] Documentar para GitHub


## Bugs de Legibilidade v5.2 (Concluído)
- [x] Aumentar tamanho de fonte no painel de notificações (text-base + font-semibold)
- [x] Aumentar tamanho de fonte no menu de perfil (text-base + font-semibold)
- [x] Aumentar tamanho de fonte no menu hamburger/sidebar (text-sm)
- [x] Melhorar contraste de cores em todos os painéis (text-[#BFBFBF] em vez de text-[#4a4a4a])
- [x] Testar legibilidade em dispositivos reais (todos os 35 testes passando)


## Painéis Compactos v5.3 (Concluído)
- [x] Aumentar largura do painel de notificações (w-80 → w-96)
- [x] Aumentar altura mínima do painel de notificações (max-h-96 → max-h-[500px])
- [x] Aumentar largura do painel de perfil (w-56 → w-72)
- [x] Melhorar espaçamento interno dos painéis (p-4 → p-5, space-y-3 → space-y-4)
- [x] Testar texto não fica compactado (todos os 35 testes passando)
