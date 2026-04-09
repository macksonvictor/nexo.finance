import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

type ClerkEmailAddress = {
  id: string;
  emailAddress: string;
};

type ClerkUser = Awaited<ReturnType<typeof clerkClient.users.getUser>>;

function getPrimaryEmail(user: ClerkUser): string | null {
  const emails = (user.emailAddresses ?? []) as ClerkEmailAddress[];
  if (emails.length === 0) return null;

  const primaryEmail =
    emails.find((email) => email.id === user.primaryEmailAddressId) ??
    emails[0];

  return primaryEmail?.emailAddress ?? null;
}

function getDisplayName(user: ClerkUser, fallbackEmail: string | null): string {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .trim();

  return fullName || user.username || fallbackEmail || "Usuário";
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const auth = getAuth(req);

  if (!auth.userId) {
    return null;
  }

  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const email = getPrimaryEmail(clerkUser);
  const name = getDisplayName(clerkUser, email);

  await db.upsertUser({
    openId: auth.userId,
    name,
    email,
    loginMethod: "clerk",
    lastSignedIn: new Date(),
    ...(auth.userId === ENV.ownerUserId || email === "macksongaspar@gmail.com"
      ? { role: "admin" as const }
      : {}),
  });

  return (await db.getUserByOpenId(auth.userId)) ?? null;
}
