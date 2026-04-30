const repositoryIssueBase =
  "https://github.com/macksongaspar/nexo.finance/issues/new";
const configuredHumanSupportUrl = import.meta.env.VITE_NEXO_SUPPORT_URL as
  | string
  | undefined;

export const SUPPORT_TEAM = {
  name: "Equipe NEXO Finance",
  primaryChannel: "Central de suporte NEXO",
  humanSupportStatus:
    "Suporte privado profissional em preparação. A IA faz a triagem e direciona casos sensíveis para canal seguro.",
  humanSupportUrl: configuredHumanSupportUrl?.trim() || "/suporte",
  githubBugUrl: `${repositoryIssueBase}?template=bug_report.yml&labels=bug`,
  githubSuggestionUrl: `${repositoryIssueBase}?template=feature_request.yml&labels=sugestao`,
  hours: "Segunda a sexta, 9h às 18h",
  expectedResponse: "Resposta humana privada será ativada em canal profissional",
  chatwootDocsUrl: "https://www.chatwoot.com/",
};
