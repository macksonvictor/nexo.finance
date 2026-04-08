import { ForbiddenError } from "@shared/_core/errors";
import { clerkClient, requireAuth } from "@clerk/express";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

class SDKServer {
  async authenticateRequest(req: Request): Promise<User> {
    const auth = (req as any).auth;

    if (!auth || !auth.userId) {
      throw ForbiddenError("Invalid session");
    }

    const clerkUserId = auth.userId;
    const signedInAt = new Date();

    let user = await db.getUserByOpenId(clerkUserId);

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        await db.upsertUser({
          openId: clerkUserId,
          name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          loginMethod: "clerk",
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(clerkUserId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from Clerk:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
