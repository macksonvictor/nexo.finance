import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { calculateCaixaSpent } from "./db";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-nexo",
    email: "test@nexo.finance",
    name: "Test User",
    loginMethod: "clerk",
    role: "user",
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    planExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.logout", () => {
  it("returns success for the client-side sign-out flow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@nexo.finance");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("finance router structure", () => {
  it("has all required finance procedures", () => {
    const router = appRouter._def.procedures;
    expect(router["finance.getMonth"]).toBeDefined();
    expect(router["finance.setIncome"]).toBeDefined();
    expect(router["finance.addCaixa"]).toBeDefined();
    expect(router["finance.updateCaixa"]).toBeDefined();
    expect(router["finance.deleteCaixa"]).toBeDefined();
    expect(router["finance.addTransaction"]).toBeDefined();
    expect(router["finance.deleteTransaction"]).toBeDefined();
    expect(router["finance.addMeta"]).toBeDefined();
    expect(router["finance.updateMeta"]).toBeDefined();
    expect(router["finance.deleteMeta"]).toBeDefined();
  });
});

describe("calculateCaixaSpent", () => {
  it("counts expenses and transfers, but ignores income", () => {
    const spent = calculateCaixaSpent([
      { type: "expense", amount: 120 },
      { type: "income", amount: 80 },
      { type: "transfer", amount: 35 },
    ]);

    expect(spent).toBe(155);
  });

  it("returns zero when there are no outgoing transactions", () => {
    const spent = calculateCaixaSpent([
      { type: "income", amount: 50 },
      { type: "income", amount: 75 },
    ]);

    expect(spent).toBe(0);
  });
});
