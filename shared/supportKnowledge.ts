export type SupportCategoryId =
  | "primeiros-passos"
  | "conta-acesso"
  | "planos-pagamento"
  | "caixas-metas"
  | "nexo-ia"
  | "problemas-tecnicos"
  | "seguranca-dados";

export type SupportEscalation =
  | "self_service"
  | "private_support"
  | "github_bug"
  | "github_suggestion";

export interface SupportCategory {
  id: SupportCategoryId;
  title: string;
  description: string;
}

export interface SupportArticleSection {
  title: string;
  body?: string[];
  steps?: string[];
}

export interface SupportArticle {
  id: string;
  categoryId: SupportCategoryId;
  title: string;
  summary: string;
  updatedAt: string;
  readTime: string;
  helpful: number;
  featured?: boolean;
  escalation?: SupportEscalation;
  keywords?: string[];
  sections: SupportArticleSection[];
  commonIssues?: Array<{
    question: string;
    answer: string;
  }>;
}

export const supportCategories: SupportCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    description: "Comece o mês, entenda o fluxo e deixe o NEXO pronto para uso.",
  },
  {
    id: "conta-acesso",
    title: "Conta e acesso",
    description: "Login, perfil, troca de conta, idioma, tema e preferências.",
  },
  {
    id: "planos-pagamento",
    title: "Planos e pagamento",
    description: "Planos, pagamento seguro, créditos e cobrança.",
  },
  {
    id: "caixas-metas",
    title: "Caixas e metas",
    description: "Distribuição da receita, metas, histórico, relatórios e indicadores.",
  },
  {
    id: "nexo-ia",
    title: "Nexo IA",
    description: "Conversas, contexto, créditos, IA Python e respostas financeiras.",
  },
  {
    id: "problemas-tecnicos",
    title: "Problemas técnicos",
    description: "Bugs, travamentos, tela quebrada, navegador e desempenho.",
  },
  {
    id: "seguranca-dados",
    title: "Segurança e dados",
    description: "Privacidade, chaves, dados financeiros e boas práticas.",
  },
];

export const supportArticles: SupportArticle[] = [
  {
    id: "comece-pelo-mes",
    categoryId: "primeiros-passos",
    title: "Como começar seu mês no NEXO",
    summary:
      "Configure o mês atual, informe a receita e crie o primeiro mapa financeiro antes de analisar gráficos.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 48,
    featured: true,
    escalation: "self_service",
    keywords: ["inicio", "comecar", "dashboard", "receita", "mes"],
    sections: [
      {
        title: "A ordem mais segura",
        steps: [
          "Confirme o mês em andamento no seletor lateral.",
          "Informe a receita planejada no Dashboard.",
          "Crie caixas para as missões principais do dinheiro.",
          "Registre movimentações no Histórico quando houver gastos ou entradas.",
          "Depois disso, confira Relatórios, Indicadores e a leitura da Nexo IA.",
        ],
      },
      {
        title: "Por que alguns blocos ficam vazios no início",
        body: [
          "O NEXO evita inventar informação. Sem receita, caixas ou histórico, alguns cards mostram estados vazios com atalhos para completar o mapa.",
          "Depois que existem caixas e registros reais, gráficos e indicadores passam a ter base para comparar planejado, realizado e risco.",
        ],
      },
    ],
    commonIssues: [
      {
        question: "Criei uma caixa e ainda vejo estados vazios. Isso é bug?",
        answer:
          "Nem sempre. Alguns gráficos precisam de caixa planejada e também movimentações do mês. Se o dado foi criado e não aparece após recarregar, aí pode ser bug técnico.",
      },
      {
        question: "A IA já funciona sem dados?",
        answer:
          "Funciona para orientar próximos passos, mas a leitura financeira fica melhor quando receita, caixas, metas e histórico existem.",
      },
    ],
  },
  {
    id: "informar-receita",
    categoryId: "primeiros-passos",
    title: "Como informar ou editar a receita do mês",
    summary:
      "A receita planejada é a base para saldo livre, caixas, metas, indicadores e respostas da IA.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 31,
    escalation: "self_service",
    keywords: ["receita", "salario", "renda", "editar receita", "entrada"],
    sections: [
      {
        title: "Editar receita pelo Dashboard",
        steps: [
          "Abra o Dashboard.",
          "Localize o card Receita planejada.",
          "Clique em Editar.",
          "Informe o valor total previsto para o período.",
          "Salve e revise se as caixas continuam coerentes.",
        ],
      },
      {
        title: "O que muda depois da edição",
        body: [
          "O saldo livre, percentuais de distribuição e parte dos indicadores são recalculados usando a nova receita.",
          "Se você diminui a receita, uma caixa antes saudável pode passar a pressionar o mês. Por isso vale revisar caixas e metas depois da mudança.",
        ],
      },
    ],
  },
  {
    id: "criar-primeira-caixa",
    categoryId: "primeiros-passos",
    title: "Como criar a primeira caixa",
    summary:
      "Caixas separam seu dinheiro por missão: essencial, reserva, investimento, lazer, estudos ou qualquer plano do mês.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 53,
    featured: true,
    escalation: "self_service",
    keywords: ["caixa", "caixas", "categoria", "orcamento", "distribuicao"],
    sections: [
      {
        title: "Criar caixa",
        steps: [
          "Abra Caixas na barra lateral.",
          "Clique em Criar primeira caixa ou Nova caixa.",
          "Escolha um nome claro, como Mercado, Aluguel, Reserva ou Estudos.",
          "Defina o valor planejado para aquela missão.",
          "Salve e volte ao Dashboard para conferir a distribuição.",
        ],
      },
      {
        title: "Boa prática",
        body: [
          "Comece com poucas caixas. Um mapa simples é usado de verdade vale mais do que muitas categorias que você abandona depois.",
          "Quando o mês estiver rodando, crie caixas mais especificas se perceber que alguma área está misturada demais.",
        ],
      },
    ],
  },
  {
    id: "ler-dashboard",
    categoryId: "primeiros-passos",
    title: "Como ler o Dashboard sem se perder",
    summary:
      "O Dashboard mostra o estado do mês: receita, caixas ativas, saldo livre, distribuição e atalhos de ação.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 37,
    featured: true,
    escalation: "self_service",
    keywords: ["dashboard", "painel", "visão geral", "saldo livre"],
    sections: [
      {
        title: "O que olhar primeiro",
        body: [
          "Comece pelo mês atual, depois olhe receita planejada, caixas ativas e saldo livre. Esses três pontos dizem se o mês tem mapa suficiente para decisão.",
          "Se existir alerta, trate como prioridade. Se existir estado vazio, use o CTA do próprio card para completar a base.",
        ],
      },
      {
        title: "Quando usar Perguntar a IA",
        body: [
          "Use o atalho quando quiser uma leitura rápida sobre a tela atual. A IA contextual não substitui o histórico, mas ajuda a escolher o próximo passo.",
        ],
      },
    ],
  },
  {
    id: "conta-login-clerk",
    categoryId: "conta-acesso",
    title: "Conta, login e troca de conta",
    summary:
      "Entenda login, perfil, saída da conta e troca de conta com segurança.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 22,
    escalation: "private_support",
    keywords: ["conta", "login", "entrar", "sair", "mudar conta"],
    sections: [
      {
        title: "Como trocar de conta",
        steps: [
          "Abra o perfil no topo direito.",
          "Use Mudar de conta para voltar ao acesso e entrar com outro usuário.",
          "Caso a troca ainda esteja em fase local, saia da conta e entre novamente com o usuário correto.",
        ],
      },
      {
        title: "Quando pedir suporte humano",
        body: [
          "Se o problema envolve e-mail, acesso, senha, conta errada ou dados pessoais, use suporte privado. Não exponhá essas informações em canais públicos.",
        ],
      },
    ],
  },
  {
    id: "idioma-tema-preferencias",
    categoryId: "conta-acesso",
    title: "Idioma, tema e preferências",
    summary:
      "O idioma e o tema ficam nas configurações. A tradução completa do app deve evoluir por etapas.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 18,
    escalation: "self_service",
    keywords: ["idioma", "lingua", "ingles", "portugues", "tema", "claro", "escuro"],
    sections: [
      {
        title: "Onde alterar",
        steps: [
          "Abra o perfil no topo.",
          "Clique em Configurações.",
          "Entre em Geral.",
          "Escolha idioma e tema.",
        ],
      },
      {
        title: "O que esperar agora",
        body: [
          "A preferência de idioma pode ser salva antes de toda a interface estar traduzida. Isso permite evoluir tela por tela sem quebrar o app.",
          "Se algum texto continuar em português depois de mudar o idioma, registre como melhoria de tradução, não como erro financeiro.",
        ],
      },
    ],
  },
  {
    id: "planos-e-checkout-stripe",
    categoryId: "planos-pagamento",
    title: "Planos e pagamento seguro",
    summary:
      "Premium, Pro e Elite usam uma etapa segura de pagamento antes de liberar o plano.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 29,
    featured: true,
    escalation: "private_support",
    keywords: ["pagamento", "checkout", "premium", "pro", "elite", "assinatura"],
    sections: [
      {
        title: "Como assinar",
        steps: [
          "Abra o perfil no topo direito.",
          "Clique em Atualizar.",
          "Escolha Premium, Pro ou Elite.",
          "Continue no ambiente seguro de pagamento.",
          "Ao cancelar ou concluir, o app deve voltar para o shell normal.",
        ],
      },
      {
        title: "Se o botão não abrir",
        body: [
          "Feche e abra novamente o modal de planos. Se continuar sem abrir, registre como problema técnico sem incluir dados pessoais.",
          "Problemas de pagamento, cobrança, assinatura ou cartão devem ser tratados em suporte privado, nunca em canal público.",
        ],
      },
    ],
    commonIssues: [
      {
        question: "Voltei do pagamento e fiquei preso na tela de planos.",
        answer:
          "Isso é fluxo técnico do app. Se a tela voltar sem menu, reporte como problema técnico sem dados pessoais.",
      },
      {
        question: "Meu cartão foi recusado.",
        answer:
          "Esse tipo de caso é privado. A IA pode orientar, mas o atendimento humano deve ocorrer por canal profissional privado.",
      },
    ],
  },
  {
    id: "creditos-nexo-ia",
    categoryId: "planos-pagamento",
    title: "Como funcionam os créditos da Nexo IA",
    summary:
      "Créditos limitam uso da IA e ajudam a controlar custo, plano e renovação diária ou mensal.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 20,
    escalation: "self_service",
    keywords: ["creditos", "ia", "limite", "uso", "renovacao"],
    sections: [
      {
        title: "Onde ver créditos",
        steps: [
          "Abra o perfil.",
          "Clique em Créditos NEXO IA.",
          "Confira usado, limite, restante e previsão de renovação.",
        ],
      },
      {
        title: "Por que existe limite",
        body: [
          "Cada resposta da IA pode consumir processamento. O limite evita uso acidental, ajuda a manter previsibilidade e prepara diferenças entre planos.",
        ],
      },
    ],
  },
  {
    id: "cancelamento-reembolso",
    categoryId: "planos-pagamento",
    title: "Cancelamento, reembolso e cobrança indevida",
    summary:
      "Assuntos de cobrança devem ir para suporte humano privado com contexto seguro.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 12,
    escalation: "private_support",
    keywords: ["cancelar", "reembolso", "cobranca", "cobranca indevida", "fatura"],
    sections: [
      {
        title: "O que a IA pode fazer",
        body: [
          "A IA pode explicar onde ficam planos, como funciona o pagamento e quais dados separar antes de pedir ajuda.",
          "Ela não deve pedir número de cartão, documento, senha ou prints com dados sensíveis.",
        ],
      },
      {
        title: "O que separar para humano",
        steps: [
          "Plano escolhido.",
          "Data aproximada do pagamento.",
          "E-mail da conta no app.",
          "Descricao do que aconteceu, sem expor cartão ou chaves.",
        ],
      },
    ],
  },
  {
    id: "caixas-metas-historico",
    categoryId: "caixas-metas",
    title: "Caixas, metas e histórico trabalhando juntos",
    summary:
      "Caixas organizam o mês, metas acompanham objetivos e histórico registra o que aconteceu.",
    updatedAt: "29 abr 2026",
    readTime: "5 min",
    helpful: 45,
    featured: true,
    escalation: "self_service",
    keywords: ["caixas", "metas", "historico", "transacao", "movimentacao"],
    sections: [
      {
        title: "Como pensar cada área",
        body: [
          "Caixa é destino do dinheiro no mês. Meta é objetivo acumulado. Histórico é memória do que foi registrado.",
          "Quando as três áreas estão preenchidas, o NEXO consegue mostrar comparação, risco, consistência e recomendações melhores.",
        ],
      },
      {
        title: "Fluxo recomendado",
        steps: [
          "Planeje a caixa.",
          "Registre movimentações no histórico.",
          "Acompanhe metas quando guardar valor para um objetivo.",
          "Revise relatórios e indicadores depois de alguns registros.",
        ],
      },
    ],
  },
  {
    id: "relatorios-indicadores",
    categoryId: "caixas-metas",
    title: "Por que Relatórios ou Indicadores ainda aparecem vazios",
    summary:
      "Alguns gráficos precisam de caixa planejada e registros reais para não mostrar uma leitura falsa.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 28,
    escalation: "self_service",
    keywords: ["relatorios", "indicadores", "grafico", "vazio", "dados"],
    sections: [
      {
        title: "Dados minimos",
        steps: [
          "Informe receita do mês.",
          "Crie ao menos uma caixa planejada.",
          "Registre movimentações no histórico.",
          "Recarregue a tela se acabou de criar os dados.",
        ],
      },
      {
        title: "Quando vira bug",
        body: [
          "Se existem caixas, valores e histórico, mas o gráfico continua dizendo que não há dados após recarregar, reporte um problema técnico com passos de reprodução e sem dados sensíveis.",
        ],
      },
    ],
  },
  {
    id: "exportar-historico",
    categoryId: "caixas-metas",
    title: "Exportar histórico em CSV",
    summary:
      "A exportação fica no Histórico para manter a sidebar limpa e deixar dados do mês no lugar certo.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 17,
    escalation: "self_service",
    keywords: ["exportar", "csv", "historico", "backup", "dados"],
    sections: [
      {
        title: "Como exportar",
        steps: [
          "Abra Histórico.",
          "Confira o mês selecionado.",
          "Clique em Exportar.",
          "Guarde o CSV em local seguro.",
        ],
      },
      {
        title: "Cuidado com privacidade",
        body: [
          "CSV pode conter descrição de gastos e valores. Não envie esse arquivo em canais públicos.",
        ],
      },
    ],
  },
  {
    id: "usar-nexo-ia",
    categoryId: "nexo-ia",
    title: "Como usar a Nexo IA",
    summary:
      "A IA oficial abre limpa, mantém histórico salvo e os atalhos Perguntar a IA usam contexto da tela.",
    updatedAt: "29 abr 2026",
    readTime: "5 min",
    helpful: 41,
    featured: true,
    escalation: "self_service",
    keywords: ["nexo ia", "ia", "chat", "conversa", "perguntar"],
    sections: [
      {
        title: "Dois modos de uso",
        body: [
          "O botão superior abre a IA oficial em uma janela grande. Ela começa limpa, mas conversas anteriores continuam no histórico.",
          "Os botões Perguntar a IA dentro das telas abrem uma conversa contextual menor, usando o que aquela tela sabe naquele momento.",
        ],
      },
      {
        title: "Como obter resposta melhor",
        steps: [
          "Tenha receita e caixas criadas.",
          "Registre movimentações no histórico.",
          "Pergunte de forma objetiva.",
          "Peça plano de ação quando quiser próximos passos.",
        ],
      },
    ],
  },
  {
    id: "ia-nao-responde",
    categoryId: "nexo-ia",
    title: "A IA não respondeu ou respondeu fraco",
    summary:
      "Verifique chave da IA, limite de créditos, contexto financeiro e estado do backend.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 19,
    escalation: "github_bug",
    keywords: ["ia nao responde", "erro ia", "creditos", "openai", "modelo"],
    sections: [
      {
        title: "Checklist rápido",
        steps: [
          "Confirme se ainda há créditos disponíveis.",
          "Confira se `OPENAI_API_KEY` está configurada no backend.",
          "Teste uma pergunta simples.",
          "Abra o console/logs se estiver em desenvolvimento.",
        ],
      },
      {
        title: "Quando abrir bug",
        body: [
          "Se a IA não abre, trava a janela, perde histórico ou falhá mesmo com o app configurado, reporte um problema técnico com passos e sem dados sensíveis.",
        ],
      },
    ],
  },
  {
    id: "python-ia-validacao",
    categoryId: "nexo-ia",
    title: "Validar a IA Python em shadow mode",
    summary:
      "O microserviço Python deve ser testado no WSL com Python 3.12 antes de influenciar respostas reais.",
    updatedAt: "29 abr 2026",
    readTime: "5 min",
    helpful: 16,
    escalation: "self_service",
    keywords: ["python", "wsl", "shadow mode", "risk", "patterns", "predict"],
    sections: [
      {
        title: "Sequência recomendada",
        steps: [
          "Use WSL com Python 3.12.",
          "Crie e ative a venv do microserviço.",
          "Rode `pnpm check:py` e `pnpm test:py`.",
          "Suba `uvicorn` na porta 8001.",
          "Teste `/health`, `/analyze/patterns`, `/risk/score` e `/predict/spending`.",
          "Ative `PY_AI_ENABLED=true` com `PY_AI_SHADOW_MODE=true` primeiro.",
        ],
      },
    ],
  },
  {
    id: "bug-ou-suporte-privado",
    categoryId: "problemas-tecnicos",
    title: "Quando reportar bug e quando pedir suporte privado",
    summary:
      "Bug técnico pode virar registro público. Conta, pagamento e dados pessoais devem ficar em suporte privado.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 36,
    featured: true,
    escalation: "github_bug",
    keywords: ["bug", "suporte", "erro", "privado", "publico"],
    sections: [
      {
        title: "Pode virar registro técnico público",
        body: [
          "Tela quebrada, botão sem ação, erro de layout, problema de build, comportamento repetível sem dados pessoais e sugestões de melhoria.",
        ],
      },
      {
        title: "Deve ficar no suporte privado",
        body: [
          "Pagamento, e-mail da conta, print com valores pessoais, chaves, tokens, dados bancários, senha, telefone ou qualquer informação privada.",
        ],
      },
      {
        title: "Como escrever um bom bug",
        steps: [
          "Explique o que aconteceu.",
          "Liste passos para reproduzir.",
          "Diga o que esperava.",
          "Inclua navegador e tamanho de tela.",
          "Remova dados sensíveis de prints e logs.",
        ],
      },
    ],
  },
  {
    id: "app-parou-de-rodar",
    categoryId: "problemas-tecnicos",
    title: "O app parou de rodar localmente",
    summary:
      "Checklist para servidor local, porta 3000, variáveis, build e reinício depois de mudar .env.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 24,
    escalation: "github_bug",
    keywords: ["localhost", "porta", "app parou", "pnpm dev", "build", "vite"],
    sections: [
      {
        title: "Verificações",
        steps: [
          "Rode `pnpm install` se dependências mudaram.",
          "Rode `pnpm dev` na raiz do projeto.",
          "Confirme se `http://localhost:3000` responde.",
          "Se mudou `.env`, pare e suba o app novamente.",
          "Se a porta estiver ocupada, confira o terminal para ver qual porta foi usada.",
        ],
      },
      {
        title: "Antes de abrir bug",
        body: [
          "Rode `pnpm check` e `pnpm build`. Se falhar, copie apenas a parte do erro sem segredos.",
        ],
      },
    ],
  },
  {
    id: "sugestao-produto",
    categoryId: "problemas-tecnicos",
    title: "Como sugerir melhoria de produto",
    summary:
      "Sugestões de UX, suporte, IA, relatórios e fluxos podem virar registro público quando não tiverem dados privados.",
    updatedAt: "29 abr 2026",
    readTime: "2 min",
    helpful: 15,
    escalation: "github_suggestion",
    keywords: ["sugestao", "melhoria", "feature", "ideia", "roadmap"],
    sections: [
      {
        title: "O que escrever",
        steps: [
          "Qual problema a melhoria resolve.",
          "Como você imagina a solução.",
          "Qual tela seria afetada.",
          "Se existe referência visual ou produto parecido.",
        ],
      },
    ],
  },
  {
    id: "privacidade-dados",
    categoryId: "seguranca-dados",
    title: "Privacidade dos dados financeiros",
    summary:
      "Dados financeiros exigem cuidado especial em prints, arquivos CSV, suporte e futuras integrações.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 27,
    escalation: "private_support",
    keywords: ["privacidade", "dados", "financeiro", "csv", "historico"],
    sections: [
      {
        title: "Regra principal",
        body: [
          "Não publique dados financeiros em canais públicos ou prints abertos. Se precisar pedir ajuda, remova valores, e-mails, telefones e nomes de transações sensíveis.",
        ],
      },
      {
        title: "CSV e exportação",
        body: [
          "Arquivos CSV podem revelar sua rotina financeira. Guarde em local seguro e compartilhe apenas por canal privado e profissional quando necessário.",
        ],
      },
    ],
  },
  {
    id: "segredos-e-chaves",
    categoryId: "seguranca-dados",
    title: "O que nunca colocar em canal público",
    summary:
      "Chaves, webhooks, tokens, dados financeiros e arquivos .env não devem ir para canais públicos.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 34,
    featured: true,
    escalation: "self_service",
    keywords: ["segredo", "chave", "token", "env", "seguranca"],
    sections: [
      {
        title: "Nunca publique",
        steps: [
          "Chaves secretas de pagamento.",
          "Chaves secretas de login e tokens de webhook.",
          "Chaves de IA ou de qualquer provedor externo.",
          "Arquivos `.env` reais.",
          "URLs privadas com token ou dados pessoais.",
        ],
      },
      {
        title: "Se vazou",
        body: [
          "Rotacione a chave no provedor, remova do histórico público quando possível e atualize as variáveis protegidas no ambiente correto.",
        ],
      },
    ],
  },
  {
    id: "open-banking-futuro",
    categoryId: "seguranca-dados",
    title: "Conexão com banco e Open Banking",
    summary:
      "A área já fica em configurações, mas a conexão bancária real deve ser feita com provedor seguro e consentimento claro.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 21,
    escalation: "private_support",
    keywords: ["open banking", "banco", "conexão", "integracao bancaria"],
    sections: [
      {
        title: "Estado atual",
        body: [
          "A interface está preparada para conexão com banco, mas a integração real depende de provedor, consentimento, segurança e validação de produção.",
        ],
      },
      {
        title: "Cuidados",
        body: [
          "Qualquer conexão bancária deve explicar quais dados serão acessados, por quanto tempo e como o usuário pode revogar o acesso.",
        ],
      },
    ],
  },
  {
    id: "checklist-primeira-semana",
    categoryId: "primeiros-passos",
    title: "Checklist da primeira semana usando o NEXO",
    summary:
      "Uma sequência simples para sair do zero e chegar em uma leitura confiável do mês.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 11,
    escalation: "self_service",
    keywords: ["checklist", "primeira semana", "início", "organizar"],
    sections: [
      {
        title: "Dia 1",
        steps: [
          "Informe a receita planejada do mês.",
          "Crie de três a seis caixas principais.",
          "Confira se o saldo livre faz sentido.",
        ],
      },
      {
        title: "Durante a semana",
        steps: [
          "Registre movimentações importantes no Histórico.",
          "Ajuste caixas que ficaram altas ou baixas demais.",
          "Use a Nexo IA para pedir uma leitura curta do mês.",
        ],
      },
    ],
  },
  {
    id: "mudar-de-conta",
    categoryId: "conta-acesso",
    title: "Como mudar de conta",
    summary:
      "Use a troca de conta quando quiser entrar com outro acesso sem misturar dados.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 9,
    escalation: "private_support",
    keywords: ["mudar de conta", "trocar conta", "sair", "login"],
    sections: [
      {
        title: "Fluxo recomendado",
        steps: [
          "Abra o perfil no topo direito.",
          "Clique no seletor da conta.",
          "Escolha Mudar de conta.",
          "Entre novamente com o acesso correto.",
        ],
      },
      {
        title: "Quando pedir suporte",
        body: [
          "Se aparecer uma conta errada, e-mail desconhecido ou dados que não são seus, pare e procure suporte privado.",
        ],
      },
    ],
  },
  {
    id: "recuperar-acesso",
    categoryId: "conta-acesso",
    title: "Não consigo entrar na minha conta",
    summary:
      "O que verificar quando login, e-mail ou senha impedem o acesso.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 14,
    escalation: "private_support",
    keywords: ["login", "senha", "email", "acesso", "entrar"],
    sections: [
      {
        title: "Verifique primeiro",
        steps: [
          "Confirme se o e-mail digitado está correto.",
          "Tente abrir em uma janela limpa do navegador.",
          "Confira se o app não ficou preso em uma sessão antiga.",
          "Se trocou de conta, saia e entre novamente.",
        ],
      },
      {
        title: "Privacidade",
        body: [
          "Nunca envie senha, código de verificação ou print com dados pessoais em canal público.",
        ],
      },
    ],
  },
  {
    id: "plano-nao-ativou",
    categoryId: "planos-pagamento",
    title: "Assinei um plano e ele não ativou",
    summary:
      "O que fazer quando o pagamento foi concluído, mas o app ainda mostra o plano antigo.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 10,
    escalation: "private_support",
    keywords: ["plano", "premium", "pro", "elite", "ativar", "assinatura"],
    sections: [
      {
        title: "Antes de pedir ajuda",
        steps: [
          "Recarregue o app.",
          "Abra o perfil e confira o plano exibido.",
          "Aguarde alguns minutos se acabou de concluir o pagamento.",
          "Se continuar igual, procure suporte privado com o e-mail da conta e o plano escolhido.",
        ],
      },
      {
        title: "Não envie",
        body: [
          "Não envie número de cartão, código de segurança, senha ou comprovante com dados sensíveis em canal público.",
        ],
      },
    ],
  },
  {
    id: "creditos-renovacao",
    categoryId: "planos-pagamento",
    title: "Quando meus créditos da IA renovam",
    summary:
      "Entenda a diferença entre uso diário, uso mensal e limite mostrado no perfil.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 8,
    escalation: "self_service",
    keywords: ["creditos", "renovar", "limite", "ia", "uso"],
    sections: [
      {
        title: "Onde olhar",
        steps: [
          "Abra o perfil.",
          "Clique em Créditos NEXO IA.",
          "Confira usado, restante e período de renovação.",
        ],
      },
      {
        title: "Se parecer errado",
        body: [
          "Recarregue o app e confira novamente. Se o contador não mudar após uma nova conversa, reporte problema técnico sem expor dados pessoais.",
        ],
      },
    ],
  },
  {
    id: "caixa-nao-aparece-grafico",
    categoryId: "caixas-metas",
    title: "Criei caixa, mas o gráfico ainda não apareceu",
    summary:
      "Alguns gráficos precisam de caixa planejada e registro real antes de aparecer.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 13,
    escalation: "self_service",
    keywords: ["caixa", "grafico", "relatorio", "indicadores", "vazio"],
    sections: [
      {
        title: "Checklist",
        steps: [
          "Confirme se a caixa tem valor planejado.",
          "Registre uma movimentação relacionada no Histórico.",
          "Confira se o mês selecionado é o mesmo.",
          "Recarregue a página.",
        ],
      },
      {
        title: "Quando reportar",
        body: [
          "Se tudo está preenchido e o gráfico continua vazio, reporte problema técnico com passos e sem valores sensíveis.",
        ],
      },
    ],
  },
  {
    id: "excluir-caixa-ou-meta",
    categoryId: "caixas-metas",
    title: "Excluir caixa ou meta com segurança",
    summary:
      "Entenda o impacto antes de remover um item do planejamento.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 7,
    escalation: "self_service",
    keywords: ["excluir", "caixa", "meta", "apagar", "remover"],
    sections: [
      {
        title: "Antes de excluir",
        body: [
          "Excluir deve ser usado quando o item realmente não faz mais parte do planejamento. Se você só quer mudar valor, edite em vez de remover.",
        ],
      },
      {
        title: "Boa prática",
        steps: [
          "Confira se existe histórico ligado ao item.",
          "Veja se a exclusão muda relatórios ou indicadores.",
          "Confirme apenas quando tiver certeza.",
        ],
      },
    ],
  },
  {
    id: "limpar-historico-ia",
    categoryId: "nexo-ia",
    title: "Como limpar o histórico da Nexo IA",
    summary:
      "Use limpeza quando quiser reorganizar conversas sem apagar dados financeiros do app.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 10,
    escalation: "self_service",
    keywords: ["ia", "historico", "limpar", "conversa", "chat"],
    sections: [
      {
        title: "O que a limpeza afeta",
        body: [
          "Limpar conversas remove o histórico da IA, mas não deve apagar caixas, metas, receita ou histórico financeiro.",
        ],
      },
      {
        title: "Quando usar",
        steps: [
          "Quando houver muitas conversas antigas.",
          "Quando quiser recomeçar a organização da IA.",
          "Quando uma conversa ficou confusa e você prefere abrir uma nova.",
        ],
      },
    ],
  },
  {
    id: "perguntar-ia-contextual",
    categoryId: "nexo-ia",
    title: "Quando usar Perguntar a IA dentro de uma tela",
    summary:
      "Atalhos contextuais ajudam a IA entender se você está em Dashboard, Caixas, Metas ou Histórico.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 12,
    escalation: "self_service",
    keywords: ["perguntar a ia", "contexto", "dashboard", "historico", "metas"],
    sections: [
      {
        title: "Use quando quiser",
        steps: [
          "Uma leitura rápida da tela atual.",
          "Um próximo passo prático.",
          "Uma explicação sobre alerta, saldo, caixa ou meta.",
        ],
      },
      {
        title: "Diferença para IA oficial",
        body: [
          "A IA oficial é melhor para conversas longas. O Perguntar a IA é melhor para dúvidas rápidas sobre a tela aberta.",
        ],
      },
    ],
  },
  {
    id: "botao-nao-funciona",
    categoryId: "problemas-tecnicos",
    title: "Cliquei em um botão e nada aconteceu",
    summary:
      "Como separar falha de interface, configuração pendente e problema do navegador.",
    updatedAt: "29 abr 2026",
    readTime: "4 min",
    helpful: 13,
    escalation: "github_bug",
    keywords: ["botão", "clique", "não funciona", "travou", "ação"],
    sections: [
      {
        title: "Teste rápido",
        steps: [
          "Recarregue a página.",
          "Tente novamente no mesmo botão.",
          "Veja se aparece aviso no canto da tela.",
          "Se estiver em desenvolvimento, confira o console.",
        ],
      },
      {
        title: "Como reportar",
        body: [
          "Informe qual tela, qual botão, o que esperava e o que aconteceu. Remova dados pessoais de prints.",
        ],
      },
    ],
  },
  {
    id: "tema-contraste-quebrado",
    categoryId: "problemas-tecnicos",
    title: "Texto ou ícone sem contraste",
    summary:
      "O que fazer quando modo claro ou escuro deixa algo invisível ou difícil de ler.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 8,
    escalation: "github_bug",
    keywords: ["contraste", "modo claro", "modo escuro", "ícone", "texto"],
    sections: [
      {
        title: "Antes de reportar",
        steps: [
          "Confirme se o tema está em Claro, Escuro ou Auto.",
          "Recarregue a tela.",
          "Confira se o problema acontece em mais de uma página.",
        ],
      },
      {
        title: "Print útil",
        body: [
          "Um print sem dados pessoais ajuda muito, principalmente se mostrar texto branco sobre fundo claro ou ícone escuro sobre fundo escuro.",
        ],
      },
    ],
  },
  {
    id: "suporte-privado-seguro",
    categoryId: "seguranca-dados",
    title: "Quando usar suporte privado",
    summary:
      "Conta, pagamento, dados financeiros e acesso precisam de canal privado profissional.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 9,
    escalation: "private_support",
    keywords: ["suporte privado", "humano", "pagamento", "conta", "dados"],
    sections: [
      {
        title: "Use suporte privado para",
        steps: [
          "Problemas de acesso ou e-mail da conta.",
          "Pagamento, assinatura, reembolso ou cobrança.",
          "Dados financeiros, banco, histórico ou exportação.",
          "Qualquer caso com informação pessoal.",
        ],
      },
    ],
  },
  {
    id: "prints-seguros-suporte",
    categoryId: "seguranca-dados",
    title: "Como enviar prints sem expor dados",
    summary:
      "Antes de pedir ajuda, esconda valores sensíveis, e-mail, telefone e chaves.",
    updatedAt: "29 abr 2026",
    readTime: "3 min",
    helpful: 12,
    escalation: "self_service",
    keywords: ["print", "imagem", "dados", "privacidade", "suporte"],
    sections: [
      {
        title: "Oculte antes de enviar",
        steps: [
          "E-mail, telefone e nome completo quando não forem necessários.",
          "Valores financeiros detalhados.",
          "Chaves, tokens, códigos e URLs privadas.",
          "Informações bancárias ou comprovantes.",
        ],
      },
      {
        title: "Mostre apenas o necessário",
        body: [
          "Para bug visual, normalmente basta mostrar a área quebrada, o tema usado e a largura da tela.",
        ],
      },
    ],
  },
];

export const getSupportCategory = (id: SupportCategoryId) =>
  supportCategories.find((category) => category.id === id);
