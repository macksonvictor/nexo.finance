export const SUPPORT_TEAM = {
  name: "Equipe NEXO Finance",
  primaryChannel: "Central de suporte",
  supportEmail: "macksongaspar@gmail.com",
  supportMailto:
    "mailto:macksongaspar@gmail.com?subject=Suporte%20NEXO%20Finance",
  whatsappNumber: "+55 98 8578-6601",
  whatsappUrl: "https://wa.me/559885786601",
  githubIssuesUrl:
    "https://github.com/macksongaspar/nexo.finance/issues/new?template=support.yml&labels=suporte",
  githubBugUrl:
    "https://github.com/macksongaspar/nexo.finance/issues/new?template=bug_report.yml&labels=bug",
  githubSuggestionUrl:
    "https://github.com/macksongaspar/nexo.finance/issues/new?template=feature_request.yml&labels=sugestao",
  hours: "Segunda a sexta, 9h as 18h",
  expectedResponse: "Resposta humana prevista em ate 1 dia util",
};

export function buildSupportMailto(message: string) {
  const subject = encodeURIComponent("Suporte NEXO Finance");
  const body = encodeURIComponent(message);
  return `mailto:${SUPPORT_TEAM.supportEmail}?subject=${subject}&body=${body}`;
}

export function buildSupportWhatsappUrl(message: string) {
  return `${SUPPORT_TEAM.whatsappUrl}?text=${encodeURIComponent(message)}`;
}
