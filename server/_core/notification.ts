import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }

  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.ownerNotificationWebhookUrl) {
    console.info("[Notification] OWNER_NOTIFICATION_WEBHOOK_URL not configured");
    return false;
  }

  const targets = ENV.ownerNotificationWebhookUrl
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean);

  if (!targets.length) {
    console.info("[Notification] OWNER_NOTIFICATION_WEBHOOK_URL not configured");
    return false;
  }

  const body = {
    source: "nexo",
    title,
    content,
    timestamp: new Date().toISOString(),
  };

  const notifyTarget = async (target: string) => {
    const url = new URL(target);
    const isCallMeBot = url.hostname.includes("callmebot.com");

    if (isCallMeBot && !url.searchParams.has("text")) {
      url.searchParams.set("text", `${title}\n\n${content}`);
    }

    if (isCallMeBot) {
      const response = await fetch(url.toString(), { method: "GET" });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.warn(
          `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
            detail ? `: ${detail}` : ""
          }`
        );
        return false;
      }

      return true;
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  };

  try {
    const results = await Promise.allSettled(targets.map(notifyTarget));
    return results.some(
      (result) => result.status === "fulfilled" && result.value
    );
  } catch (error) {
    console.warn("[Notification] Error calling owner webhook:", error);
    return false;
  }
}
