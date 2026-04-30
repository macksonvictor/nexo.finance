import { ENV } from "./env";

type SupportIssueInput = {
  kind: "bug" | "suggestion";
  title: string;
  body: string;
};

type SupportIssueCommentInput = {
  issueUrl: string | null | undefined;
  body: string;
};

const repoParts = () => {
  const [owner, repo] = ENV.githubSupportRepo.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
};

export async function createSupportIssue(input: SupportIssueInput) {
  if (!ENV.githubToken) {
    return {
      created: false,
      reason: "GITHUB_TOKEN not configured",
      url: null,
    } as const;
  }

  const repo = repoParts();
  if (!repo) {
    return {
      created: false,
      reason: "GITHUB_SUPPORT_REPO must be owner/repo",
      url: null,
    } as const;
  }

  const label =
    input.kind === "bug"
      ? ENV.githubSupportLabelBug
      : ENV.githubSupportLabelSuggestion;

  const issueUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues`;
  const createIssue = (labels?: string[]) =>
    fetch(issueUrl, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${ENV.githubToken}`,
        "content-type": "application/json",
        "user-agent": "nexo-support-bot",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels,
      }),
    });

  let response = await createIssue(label ? [label] : undefined);

  if (!response.ok && label && response.status === 422) {
    response = await createIssue(undefined);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      created: false,
      reason: `GitHub issue failed: ${response.status} ${response.statusText}${
        detail ? ` - ${detail}` : ""
      }`,
      url: null,
    } as const;
  }

  const issue = (await response.json()) as { html_url?: string };
  return {
    created: true,
    reason: null,
    url: issue.html_url ?? null,
  } as const;
}

export async function addSupportIssueComment(input: SupportIssueCommentInput) {
  if (!ENV.githubToken) {
    return {
      created: false,
      reason: "GITHUB_TOKEN not configured",
      url: null,
    } as const;
  }

  const repo = repoParts();
  if (!repo) {
    return {
      created: false,
      reason: "GITHUB_SUPPORT_REPO must be owner/repo",
      url: null,
    } as const;
  }

  const issueNumber = input.issueUrl?.match(/\/issues\/(\d+)(?:[#?]|$)/)?.[1];
  if (!issueNumber) {
    return {
      created: false,
      reason: "Invalid issue URL",
      url: null,
    } as const;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${ENV.githubToken}`,
        "content-type": "application/json",
        "user-agent": "nexo-support-bot",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({
        body: input.body,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      created: false,
      reason: `GitHub comment failed: ${response.status} ${response.statusText}${
        detail ? ` - ${detail}` : ""
      }`,
      url: null,
    } as const;
  }

  const comment = (await response.json()) as { html_url?: string };
  return {
    created: true,
    reason: null,
    url: comment.html_url ?? null,
  } as const;
}
