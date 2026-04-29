export type SupportCategoryId =
  | "primeiros-passos"
  | "duvidas-gerais"
  | "funcionalidades"
  | "conta-planos"
  | "api-integracoes"
  | "seguranca";

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
  sections: SupportArticleSection[];
  commonIssues?: Array<{
    question: string;
    answer: string;
  }>;
}

export const supportCategories: SupportCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    description: "Comece o mes, crie caixas e entenda o fluxo principal.",
  },
  {
    id: "duvidas-gerais",
    title: "Duvidas Gerais",
    description: "Respostas rapidas sobre dados, meses, aparencia e exportacao.",
  },
  {
    id: "funcionalidades",
    title: "Funcionalidades",
    description: "Caixas, metas, historico, relatorios, indicadores e Nexo IA.",
  },
  {
    id: "conta-planos",
    title: "Conta & Planos",
    description: "Perfil, creditos da IA, planos e assinatura pelo Stripe.",
  },
  {
    id: "api-integracoes",
    title: "API & Integracoes",
    description: "Open Banking, CSV, Python IA e variaveis de ambiente.",
  },
  {
    id: "seguranca",
    title: "Seguranca",
    description: "Boas praticas para conta, chaves, dados e operacao.",
  },
];

export const supportArticles: SupportArticle[] = [
  {
    id: "como-comecar-no-nexo",
    categoryId: "primeiros-passos",
    title: "Como comecar no NEXO Finance",
    summary:
      "Configure o mes atual, informe a receita e deixe o dashboard pronto para acompanhar suas decisoes.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 34,
    featured: true,
    sections: [
      {
        title: "O que fazer primeiro",
        steps: [
          "Abra o app e confirme o mes em andamento no seletor lateral.",
          "Informe a receita planejada do periodo.",
          "Crie caixas para separar o dinheiro por missao.",
          "Use o Dashboard para conferir receita, distribuicao e saldo livre.",
        ],
      },
      {
        title: "Quando o app comeca a gerar leitura",
        body: [
          "O NEXO fica mais inteligente quando existem caixas, metas e registros do mes. Sem esses dados, algumas telas mostram estados vazios com atalhos para completar o mapa financeiro.",
        ],
      },
    ],
  },
  {
    id: "informar-receita-do-mes",
    categoryId: "primeiros-passos",
    title: "Como informar ou editar a receita do mes",
    summary:
      "A receita planejada e a base usada para distribuir caixas, calcular saldo e alimentar indicadores.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 21,
    sections: [
      {
        title: "Editar receita",
        steps: [
          "No Dashboard, encontre o card Receita planejada.",
          "Clique em Editar.",
          "Informe o novo valor e salve.",
          "Revise as caixas para garantir que a distribuicao ainda faz sentido.",
        ],
      },
      {
        title: "Impacto nos calculos",
        body: [
          "Ao mudar a receita, o saldo livre, percentuais de caixas e parte dos indicadores sao recalculados com base no novo valor.",
        ],
      },
    ],
  },
  {
    id: "criar-primeira-caixa",
    categoryId: "primeiros-passos",
    title: "Como criar a primeira caixa",
    summary:
      "Caixas separam sua receita por objetivo, como mercado, aluguel, reserva, estudos ou lazer.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 42,
    featured: true,
    sections: [
      {
        title: "Criar caixa",
        steps: [
          "Abra Caixas na barra lateral.",
          "Clique em Criar primeira caixa ou Nova caixa.",
          "Escolha nome, categoria e valor planejado.",
          "Salve e confira se o valor apareceu na distribuicao.",
        ],
      },
      {
        title: "Boa pratica",
        body: [
          "Comece com poucas caixas essenciais. Depois, refine a organizacao quando o mes ja estiver andando.",
        ],
      },
    ],
  },
  {
    id: "criar-meta-financeira",
    categoryId: "primeiros-passos",
    title: "Como criar uma meta financeira",
    summary:
      "Metas ajudam a acompanhar objetivos maiores, como notebook, reserva de emergencia ou viagem.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 19,
    sections: [
      {
        title: "Criar meta",
        steps: [
          "Abra Metas.",
          "Clique em Nova meta.",
          "Defina nome, valor-alvo e prazo.",
          "Atualize o progresso sempre que guardar dinheiro para esse objetivo.",
        ],
      },
    ],
  },
  {
    id: "entender-dashboard",
    categoryId: "primeiros-passos",
    title: "Como ler o Dashboard",
    summary:
      "Entenda os principais cards do mes: receita, distribuicao, saldo livre, caixas e atalho da IA.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 27,
    sections: [
      {
        title: "Cards principais",
        body: [
          "O Dashboard mostra a visao geral do mes. Ele resume quanto foi planejado, quanto ja foi distribuido e quais pontos merecem atencao.",
          "Quando houver pouca informacao, use os CTAs dos estados vazios para criar caixas, abrir historico ou pedir uma leitura para a Nexo IA.",
        ],
      },
    ],
  },
  {
    id: "onde-ficam-meus-dados",
    categoryId: "duvidas-gerais",
    title: "Onde ficam meus dados?",
    summary:
      "Entenda o estado atual de armazenamento local, app e proximas integracoes de conta.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 18,
    sections: [
      {
        title: "Estado atual",
        body: [
          "Nesta fase, parte da experiencia usa armazenamento local e estado do app. A integracao completa com banco, Clerk e backend persistente fica documentada como proximo passo tecnico.",
        ],
      },
    ],
  },
  {
    id: "trocar-mes",
    categoryId: "duvidas-gerais",
    title: "Como trocar o mes em analise",
    summary:
      "Use o seletor de mes para revisar outro periodo sem perder a leitura do mes atual.",
    updatedAt: "28 abr 2026",
    readTime: "1 min",
    helpful: 12,
    sections: [
      {
        title: "Trocar periodo",
        steps: [
          "Clique no seletor de mes na sidebar.",
          "Escolha o periodo desejado.",
          "Revise caixas, historico e indicadores daquele mes.",
        ],
      },
    ],
  },
  {
    id: "modo-claro-escuro",
    categoryId: "duvidas-gerais",
    title: "Como alternar entre modo claro e escuro",
    summary:
      "Aparencia pode ser alterada nas configuracoes e salva como preferencia local.",
    updatedAt: "28 abr 2026",
    readTime: "1 min",
    helpful: 16,
    sections: [
      {
        title: "Alterar tema",
        steps: [
          "Abra o perfil no topo.",
          "Clique em Configuracoes.",
          "Entre em Geral ou Personalizacao.",
          "Escolha Claro, Escuro ou Auto.",
        ],
      },
    ],
  },
  {
    id: "exportar-dados",
    categoryId: "duvidas-gerais",
    title: "Como exportar dados do historico",
    summary:
      "A exportacao CSV fica no Historico para manter a sidebar limpa e o fluxo mais organizado.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 15,
    sections: [
      {
        title: "Exportar CSV",
        steps: [
          "Abra Historico.",
          "Clique no botao Exportar.",
          "O arquivo CSV sera gerado com os dados do periodo atual.",
        ],
      },
    ],
  },
  {
    id: "como-funcionam-caixas",
    categoryId: "funcionalidades",
    title: "Como funcionam as Caixas",
    summary:
      "Caixas organizam sua receita por missao e permitem comparar planejado, registrado e saldo.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 31,
    featured: true,
    sections: [
      {
        title: "Uso recomendado",
        body: [
          "Cada caixa representa uma parte da receita. Uma caixa pode ser obrigatoria, flexivel ou ligada a um objetivo especifico.",
          "Use nomes simples e valores realistas. O NEXO usa esses dados para graficos, indicadores e leitura da IA.",
        ],
      },
    ],
  },
  {
    id: "como-funcionam-metas",
    categoryId: "funcionalidades",
    title: "Como funcionam as Metas",
    summary:
      "Metas acompanham objetivos acumulados e ajudam a visualizar prazo, progresso e prioridade.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 20,
    sections: [
      {
        title: "Quando usar meta",
        body: [
          "Use meta quando o objetivo passa de um mes ou precisa de acompanhamento separado, como comprar equipamento, montar reserva ou quitar uma divida.",
        ],
      },
    ],
  },
  {
    id: "historico-movimentacoes",
    categoryId: "funcionalidades",
    title: "Como usar o Historico",
    summary:
      "Historico registra movimentacoes do periodo e vira base para relatorios, exportacao e leitura da IA.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 24,
    sections: [
      {
        title: "O que aparece no historico",
        body: [
          "Entradas, gastos registrados e ajustes aparecem no historico do mes. Quanto mais fiel o historico, melhor a leitura dos relatorios.",
        ],
      },
    ],
  },
  {
    id: "relatorios",
    categoryId: "funcionalidades",
    title: "Como ler Relatorios",
    summary:
      "Relatorios mostram distribuicao, comparacao por caixa e maiores movimentacoes do mes.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 22,
    sections: [
      {
        title: "Quando os graficos aparecem",
        body: [
          "Os graficos precisam de caixas e registros do mes. Se so existir uma caixa sem movimentacao, alguns blocos ainda podem exibir estado vazio ate haver dados comparaveis.",
        ],
      },
    ],
  },
  {
    id: "indicadores",
    categoryId: "funcionalidades",
    title: "Como funcionam os Indicadores",
    summary:
      "Indicadores calculam disciplina, risco, consistencia e crescimento com base no mapa financeiro.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 25,
    sections: [
      {
        title: "Dados necessarios",
        body: [
          "Para liberar uma leitura melhor, informe receita, crie caixas e registre movimentacoes. Os indicadores ficam mais uteis com historico real.",
        ],
      },
    ],
  },
  {
    id: "nexo-ia",
    categoryId: "funcionalidades",
    title: "Como usar a Nexo IA",
    summary:
      "A Nexo IA ajuda a interpretar seu mes, responder perguntas e sugerir proximos passos.",
    updatedAt: "28 abr 2026",
    readTime: "4 min",
    helpful: 38,
    featured: true,
    sections: [
      {
        title: "IA oficial e atalhos rapidos",
        body: [
          "O botao superior abre a IA oficial em uma janela grande. Os botoes Perguntar a IA em cards abrem uma conversa contextual com dados daquela tela.",
        ],
      },
      {
        title: "Historico de conversa",
        body: [
          "Conversas anteriores permanecem no historico. Ao abrir a IA oficial pelo topo, ela inicia limpa, mas voce pode reabrir conversas salvas.",
        ],
      },
    ],
  },
  {
    id: "planos-disponiveis",
    categoryId: "conta-planos",
    title: "Quais planos existem no NEXO",
    summary:
      "Entenda Free, Premium, Pro e Elite e quando faz sentido atualizar.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 14,
    sections: [
      {
        title: "Atualizar plano",
        body: [
          "Abra o perfil e clique em Atualizar. O modal de planos aparece sobre o app e redireciona para o Stripe quando voce escolhe Premium, Pro ou Elite.",
        ],
      },
    ],
  },
  {
    id: "stripe-checkout",
    categoryId: "conta-planos",
    title: "O pagamento nao abriu. O que fazer?",
    summary:
      "Checklist de variaveis Stripe e fluxo de retorno depois do checkout.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 11,
    sections: [
      {
        title: "Conferir configuracao",
        steps: [
          "Confirme que STRIPE_SECRET_KEY esta no .env do servidor.",
          "Confirme que os price IDs Premium, Pro e Elite estao preenchidos.",
          "Reinicie o app depois de mudar variaveis de ambiente.",
          "Teste o botao de cada plano no modal de planos.",
        ],
      },
    ],
  },
  {
    id: "creditos-nexo-ia",
    categoryId: "conta-planos",
    title: "Como funcionam os creditos da Nexo IA",
    summary:
      "Creditos controlam o limite de uso da IA e renovam conforme a regra do plano.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 13,
    sections: [
      {
        title: "Onde ver creditos",
        body: [
          "Abra o perfil e clique em Creditos NEXO IA. O painel mostra usado, limite, restante e proxima renovacao quando houver dados disponiveis.",
        ],
      },
    ],
  },
  {
    id: "open-banking",
    categoryId: "api-integracoes",
    title: "Status da Conexao com banco",
    summary:
      "Open Banking fica preparado nas configuracoes, mas a conexao real ainda depende da etapa de integracao bancaria.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 17,
    sections: [
      {
        title: "Onde fica",
        body: [
          "Abra Configuracoes e procure Conexao com banco. A area foi movida para configuracoes para manter a sidebar limpa.",
        ],
      },
    ],
  },
  {
    id: "importar-csv",
    categoryId: "api-integracoes",
    title: "Como importar CSV",
    summary:
      "CSV sera usado para trazer movimentacoes de bancos ou planilhas quando a importacao estiver ativa.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 9,
    sections: [
      {
        title: "Formato esperado",
        body: [
          "A importacao deve aceitar data, descricao, valor e categoria/caixa. Enquanto a integracao completa nao estiver ativa, use o historico manual e exportacao CSV.",
        ],
      },
    ],
  },
  {
    id: "python-ia",
    categoryId: "api-integracoes",
    title: "Como validar a IA Python",
    summary:
      "Checklist para rodar o microservico Python em WSL com Python 3.12 e testar endpoints.",
    updatedAt: "28 abr 2026",
    readTime: "4 min",
    helpful: 12,
    sections: [
      {
        title: "Validacao recomendada",
        steps: [
          "Use WSL com Python 3.12.",
          "Rode check:py e test:py.",
          "Suba uvicorn e teste /health.",
          "Teste /analyze/patterns, /risk/score e /predict/spending com payloads de exemplo.",
          "Ative primeiro PY_AI_ENABLED=true e PY_AI_SHADOW_MODE=true.",
        ],
      },
    ],
  },
  {
    id: "variaveis-ambiente",
    categoryId: "api-integracoes",
    title: "Quais variaveis de ambiente configurar",
    summary:
      "Clerk, Stripe, IA Python, dominio e deploy precisam de variaveis separadas por ambiente.",
    updatedAt: "28 abr 2026",
    readTime: "3 min",
    helpful: 10,
    sections: [
      {
        title: "Regra de seguranca",
        body: [
          "Nunca publique chaves secretas no GitHub. Use .env local e variaveis protegidas no provedor de deploy.",
        ],
      },
    ],
  },
  {
    id: "proteger-conta",
    categoryId: "seguranca",
    title: "Como proteger sua conta",
    summary:
      "Boas praticas para login, senha, troca de conta e acesso em notebook compartilhado.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 18,
    sections: [
      {
        title: "Recomendacoes",
        steps: [
          "Use senha forte quando o Clerk estiver ativo.",
          "Saia da conta em dispositivos compartilhados.",
          "Nao compartilhe prints com dados sensiveis ou chaves.",
        ],
      },
    ],
  },
  {
    id: "segredos-chaves",
    categoryId: "seguranca",
    title: "O que nunca colocar no GitHub",
    summary:
      "Chaves Stripe, tokens Clerk, URLs privadas e segredos de IA devem ficar fora do repositorio.",
    updatedAt: "28 abr 2026",
    readTime: "2 min",
    helpful: 26,
    featured: true,
    sections: [
      {
        title: "Checklist",
        steps: [
          "Nao commitar .env.",
          "Nao colar sk_live, tokens privados ou webhooks em README publico.",
          "Rotacione qualquer chave que tenha sido exposta em chat, print ou commit.",
          "Use variaveis secretas no Vercel/Railway/GitHub Actions.",
        ],
      },
    ],
  },
];

export const getSupportCategory = (id: SupportCategoryId) =>
  supportCategories.find((category) => category.id === id);
