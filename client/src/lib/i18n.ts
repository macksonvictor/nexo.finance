import type { ViewType } from "@/types/finance";
import type { NexoLanguage } from "./language";

type ViewMeta = Record<ViewType, { title: string; subtitle: string }>;

export const APP_COPY: Record<
  NexoLanguage,
  {
    common: {
      account: string;
      active: string;
      backToDashboard: string;
      close: string;
      creator: string;
      free: string;
      premium: string;
      settings: string;
      upgrade: string;
    };
    navigation: Record<
      | "dashboard"
      | "caixas"
      | "metas"
      | "relatorios"
      | "indicadores"
      | "historico",
      string
    >;
    viewMeta: ViewMeta;
    accountMenu: {
      currentAccount: string;
      aiCredits: string;
      personalization: string;
      account: string;
      settings: string;
      help: string;
      logout: string;
      manage: string;
    };
    profilePanels: {
      activeAccount: string;
      switchAccountTitle: string;
      switchAccountDescription: string;
      personal: string;
      switchAccountAction: string;
      usageBilling: string;
      aiCreditsTitle: string;
      aiCreditsDescription: string;
      remainingToday: string;
      today: string;
      renewsIn: string;
      openAI: string;
      updatePlan: string;
      preferences: string;
      personalizationTitle: string;
      personalizationDescription: string;
      language: string;
      theme: string;
      accountTitle: string;
      accountDescription: string;
      fullName: string;
      currentPlan: string;
      monthlyIncome: string;
      personalDetails: string;
      userId: string;
      copy: string;
      manageAccount: string;
      manageAccountDescription: string;
      helpTitle: string;
      helpDescription: string;
      askAI: string;
      askAIDescription: string;
      openCentral: string;
      settingsDescription: string;
      fallbackReset: string;
      logoutSuccess: string;
      idCopied: string;
      idCopyError: string;
    };
    settingsModal: {
      sections: Record<
        | "geral"
        | "conta"
        | "ia"
        | "pagamento"
        | "receita"
        | "banco"
        | "historico"
        | "aparencia"
        | "ajuda",
        string
      >;
      generalTitle: string;
      preferencesEyebrow: string;
      languageNote: string;
      appearance: string;
      themeLight: string;
      themeLightDescription: string;
      themeDark: string;
      themeDarkDescription: string;
      languageSaved: string;
    };
  }
> = {
  "pt-BR": {
    common: {
      account: "Minha conta",
      active: "Plano ativo",
      backToDashboard: "Voltar para o Dashboard",
      close: "Fechar",
      creator: "Criador",
      free: "Grátis",
      premium: "Premium",
      settings: "Configurações",
      upgrade: "Upgrade",
    },
    navigation: {
      dashboard: "Dashboard",
      caixas: "Caixas",
      metas: "Metas",
      relatorios: "Relatórios",
      indicadores: "Indicadores",
      historico: "Histórico",
    },
    viewMeta: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Visão geral do mês, métricas e evolução financeira.",
      },
      caixas: {
        title: "Caixas",
        subtitle: "Distribua sua receita com clareza e acompanhe cada missão.",
      },
      metas: {
        title: "Metas",
        subtitle: "Objetivos financeiros com prazo, progresso e foco.",
      },
      historico: {
        title: "Histórico",
        subtitle: "Acompanhe sua trajetória mês a mês com mais contexto.",
      },
      relatorios: {
        title: "Relatórios",
        subtitle: "Exportação e leitura estratégica dos seus dados.",
      },
      openbanking: {
        title: "Open Banking",
        subtitle: "Conexões bancárias e dados financeiros ampliados.",
      },
      planos: {
        title: "Planos",
        subtitle: "Gerencie upgrades, benefícios e sua evolução no produto.",
      },
      ia: {
        title: "Nexo IA",
        subtitle:
          "Converse, analise e aprofunde sua leitura financeira quando quiser.",
      },
      indicadores: {
        title: "Indicadores",
        subtitle: "Leitura mais profunda da saúde financeira e da sua consistência.",
      },
      configuracoes: {
        title: "Configurações",
        subtitle: "Preferências do aplicativo, aparência e ajustes da experiência.",
      },
    },
    accountMenu: {
      currentAccount: "Minha conta",
      aiCredits: "Créditos NEXO IA",
      personalization: "Personalização",
      account: "Conta",
      settings: "Configurações",
      help: "Obter ajuda",
      logout: "Sair",
      manage: "Gerenciar",
    },
    profilePanels: {
      activeAccount: "Conta ativa",
      switchAccountTitle: "Troca de conta",
      switchAccountDescription:
        "Mostra sua conta atual e abre o fluxo de login quando você quiser entrar com outra conta.",
      personal: "Pessoal",
      switchAccountAction: "Mudar de conta",
      usageBilling: "Uso e faturamento",
      aiCreditsTitle: "Créditos NEXO IA",
      aiCreditsDescription:
        "Os créditos rápidos usam a quota diária da IA. Eles renovam automaticamente conforme a janela de uso.",
      remainingToday: "restantes hoje",
      today: "hoje",
      renewsIn: "Renova em",
      openAI: "Abrir Nexo IA",
      updatePlan: "Atualizar plano",
      preferences: "Preferências",
      personalizationTitle: "Personalização",
      personalizationDescription:
        "Ajuste idioma salvo localmente e tema. As áreas principais já reagem à preferência escolhida.",
      language: "Idioma",
      theme: "Tema",
      accountTitle: "Dados da conta",
      accountDescription:
        "Informações principais da sua conta NEXO e atalhos seguros de gerenciamento.",
      fullName: "Nome completo",
      currentPlan: "Plano atual",
      monthlyIncome: "Receita do mês",
      personalDetails: "Detalhes pessoais",
      userId: "ID do usuário",
      copy: "Copiar",
      manageAccount: "Gerenciar conta",
      manageAccountDescription:
        "Saia deste dispositivo quando precisar trocar de sessão.",
      helpTitle: "Ajuda",
      helpDescription: "Atalhos para resolver dúvidas sem sair do fluxo do app.",
      askAI: "Perguntar à Nexo IA",
      askAIDescription:
        "Use contexto do mês atual para entender caixas, metas e histórico.",
      openCentral: "Abrir central",
      settingsDescription:
        "Revise conta, pagamento, conexão com banco e preferências.",
      fallbackReset: "algumas horas",
      logoutSuccess: "Sessão encerrada com sucesso",
      idCopied: "ID copiado",
      idCopyError: "Não foi possível copiar agora",
    },
    settingsModal: {
      sections: {
        geral: "Geral",
        conta: "Conta",
        ia: "Nexo IA",
        pagamento: "Pagamentos",
        receita: "Receita",
        banco: "Conexão com banco",
        historico: "Exportação e histórico",
        aparencia: "Aparência",
        ajuda: "Obter ajuda",
      },
      generalTitle: "Geral",
      preferencesEyebrow: "Preferências",
      languageNote:
        "A preferência fica salva localmente e atualiza as áreas principais preparadas para tradução.",
      appearance: "Aparência",
      themeLight: "Claro",
      themeLightDescription: "Visual mais leve para ambientes iluminados.",
      themeDark: "Escuro",
      themeDarkDescription: "Contraste alto para manter foco no painel financeiro.",
      languageSaved: "Preferência de idioma salva",
    },
  },
  "en-US": {
    common: {
      account: "My account",
      active: "Active plan",
      backToDashboard: "Back to Dashboard",
      close: "Close",
      creator: "Creator",
      free: "Free",
      premium: "Premium",
      settings: "Settings",
      upgrade: "Upgrade",
    },
    navigation: {
      dashboard: "Dashboard",
      caixas: "Boxes",
      metas: "Goals",
      relatorios: "Reports",
      indicadores: "Indicators",
      historico: "History",
    },
    viewMeta: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Monthly overview, metrics, and financial progress.",
      },
      caixas: {
        title: "Boxes",
        subtitle: "Distribute your income clearly and track every mission.",
      },
      metas: {
        title: "Goals",
        subtitle: "Financial goals with deadline, progress, and focus.",
      },
      historico: {
        title: "History",
        subtitle: "Follow your month-by-month journey with more context.",
      },
      relatorios: {
        title: "Reports",
        subtitle: "Export and read your data with strategic context.",
      },
      openbanking: {
        title: "Open Banking",
        subtitle: "Bank connections and expanded financial data.",
      },
      planos: {
        title: "Plans",
        subtitle: "Manage upgrades, benefits, and your product journey.",
      },
      ia: {
        title: "Nexo AI",
        subtitle: "Chat, analyze, and deepen your financial reading anytime.",
      },
      indicadores: {
        title: "Indicators",
        subtitle: "A deeper reading of financial health and consistency.",
      },
      configuracoes: {
        title: "Settings",
        subtitle: "App preferences, appearance, and experience adjustments.",
      },
    },
    accountMenu: {
      currentAccount: "My account",
      aiCredits: "NEXO AI credits",
      personalization: "Personalization",
      account: "Account",
      settings: "Settings",
      help: "Get help",
      logout: "Log out",
      manage: "Manage",
    },
    profilePanels: {
      activeAccount: "Active account",
      switchAccountTitle: "Switch account",
      switchAccountDescription:
        "Shows your current account and opens the sign-in flow when you want to use another account.",
      personal: "Personal",
      switchAccountAction: "Switch account",
      usageBilling: "Usage and billing",
      aiCreditsTitle: "NEXO AI credits",
      aiCreditsDescription:
        "Quick credits use the daily AI quota and renew automatically with the usage window.",
      remainingToday: "remaining today",
      today: "today",
      renewsIn: "Renews at",
      openAI: "Open Nexo AI",
      updatePlan: "Update plan",
      preferences: "Preferences",
      personalizationTitle: "Personalization",
      personalizationDescription:
        "Adjust the locally saved language and theme. Main areas now react to your selected preference.",
      language: "Language",
      theme: "Theme",
      accountTitle: "Account details",
      accountDescription:
        "Main NEXO account information and safe management shortcuts.",
      fullName: "Full name",
      currentPlan: "Current plan",
      monthlyIncome: "Monthly income",
      personalDetails: "Personal details",
      userId: "User ID",
      copy: "Copy",
      manageAccount: "Manage account",
      manageAccountDescription:
        "Log out of this device when you need to switch sessions.",
      helpTitle: "Help",
      helpDescription: "Shortcuts to solve questions without leaving the app flow.",
      askAI: "Ask Nexo AI",
      askAIDescription:
        "Use current-month context to understand boxes, goals, and history.",
      openCentral: "Open center",
      settingsDescription:
        "Review account, payment, bank connection, and preferences.",
      fallbackReset: "a few hours",
      logoutSuccess: "Session closed successfully",
      idCopied: "ID copied",
      idCopyError: "Could not copy right now",
    },
    settingsModal: {
      sections: {
        geral: "General",
        conta: "Account",
        ia: "Nexo AI",
        pagamento: "Payments",
        receita: "Income",
        banco: "Bank connection",
        historico: "Export and history",
        aparencia: "Appearance",
        ajuda: "Get help",
      },
      generalTitle: "General",
      preferencesEyebrow: "Preferences",
      languageNote:
        "This preference is saved locally and updates the main translation-ready areas.",
      appearance: "Appearance",
      themeLight: "Light",
      themeLightDescription: "A lighter interface for bright environments.",
      themeDark: "Dark",
      themeDarkDescription: "High contrast to keep focus on the financial panel.",
      languageSaved: "Language preference saved",
    },
  },
  "es-ES": {
    common: {
      account: "Mi cuenta",
      active: "Plan activo",
      backToDashboard: "Volver al Dashboard",
      close: "Cerrar",
      creator: "Creador",
      free: "Gratis",
      premium: "Premium",
      settings: "Configuración",
      upgrade: "Actualizar",
    },
    navigation: {
      dashboard: "Dashboard",
      caixas: "Cajas",
      metas: "Metas",
      relatorios: "Informes",
      indicadores: "Indicadores",
      historico: "Historial",
    },
    viewMeta: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Vista mensual, métricas y evolución financiera.",
      },
      caixas: {
        title: "Cajas",
        subtitle: "Distribuye tus ingresos con claridad y sigue cada misión.",
      },
      metas: {
        title: "Metas",
        subtitle: "Objetivos financieros con plazo, progreso y foco.",
      },
      historico: {
        title: "Historial",
        subtitle: "Acompaña tu trayectoria mes a mes con más contexto.",
      },
      relatorios: {
        title: "Informes",
        subtitle: "Exportación y lectura estratégica de tus datos.",
      },
      openbanking: {
        title: "Open Banking",
        subtitle: "Conexiones bancarias y datos financieros ampliados.",
      },
      planos: {
        title: "Planes",
        subtitle: "Gestiona mejoras, beneficios y tu evolución en el producto.",
      },
      ia: {
        title: "Nexo IA",
        subtitle: "Conversa, analiza y profundiza tu lectura financiera cuando quieras.",
      },
      indicadores: {
        title: "Indicadores",
        subtitle: "Lectura más profunda de la salud financiera y consistencia.",
      },
      configuracoes: {
        title: "Configuración",
        subtitle: "Preferencias, apariencia y ajustes de experiencia.",
      },
    },
    accountMenu: {
      currentAccount: "Mi cuenta",
      aiCredits: "Créditos NEXO IA",
      personalization: "Personalización",
      account: "Cuenta",
      settings: "Configuración",
      help: "Obtener ayuda",
      logout: "Salir",
      manage: "Gestionar",
    },
    profilePanels: {
      activeAccount: "Cuenta activa",
      switchAccountTitle: "Cambiar cuenta",
      switchAccountDescription:
        "Muestra tu cuenta actual y abre el inicio de sesión cuando quieras usar otra cuenta.",
      personal: "Personal",
      switchAccountAction: "Cambiar cuenta",
      usageBilling: "Uso y facturación",
      aiCreditsTitle: "Créditos NEXO IA",
      aiCreditsDescription:
        "Los créditos rápidos usan la cuota diaria de IA y se renuevan automáticamente.",
      remainingToday: "restantes hoy",
      today: "hoy",
      renewsIn: "Renueva a las",
      openAI: "Abrir Nexo IA",
      updatePlan: "Actualizar plan",
      preferences: "Preferencias",
      personalizationTitle: "Personalización",
      personalizationDescription:
        "Ajusta el idioma guardado localmente y el tema. Las áreas principales ya reaccionan a la preferencia elegida.",
      language: "Idioma",
      theme: "Tema",
      accountTitle: "Datos de la cuenta",
      accountDescription:
        "Información principal de tu cuenta NEXO y accesos seguros de gestión.",
      fullName: "Nombre completo",
      currentPlan: "Plan actual",
      monthlyIncome: "Ingreso del mes",
      personalDetails: "Detalles personales",
      userId: "ID de usuario",
      copy: "Copiar",
      manageAccount: "Gestionar cuenta",
      manageAccountDescription:
        "Cierra sesión en este dispositivo cuando necesites cambiar de sesión.",
      helpTitle: "Ayuda",
      helpDescription: "Atajos para resolver dudas sin salir del flujo del app.",
      askAI: "Preguntar a Nexo IA",
      askAIDescription:
        "Usa el contexto del mes actual para entender cajas, metas e historial.",
      openCentral: "Abrir central",
      settingsDescription:
        "Revisa cuenta, pagos, conexión bancaria y preferencias.",
      fallbackReset: "algunas horas",
      logoutSuccess: "Sesión cerrada con éxito",
      idCopied: "ID copiado",
      idCopyError: "No fue posible copiar ahora",
    },
    settingsModal: {
      sections: {
        geral: "General",
        conta: "Cuenta",
        ia: "Nexo IA",
        pagamento: "Pagos",
        receita: "Ingreso",
        banco: "Conexión bancaria",
        historico: "Exportación e historial",
        aparencia: "Apariencia",
        ajuda: "Obtener ayuda",
      },
      generalTitle: "General",
      preferencesEyebrow: "Preferencias",
      languageNote:
        "La preferencia se guarda localmente y actualiza las áreas principales preparadas para traducción.",
      appearance: "Apariencia",
      themeLight: "Claro",
      themeLightDescription: "Visual más liviano para ambientes iluminados.",
      themeDark: "Oscuro",
      themeDarkDescription: "Alto contraste para mantener foco en el panel financiero.",
      languageSaved: "Preferencia de idioma guardada",
    },
  },
};

export function getAppCopy(language: NexoLanguage) {
  return APP_COPY[language] ?? APP_COPY["pt-BR"];
}
