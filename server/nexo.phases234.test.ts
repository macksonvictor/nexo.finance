import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");

  return {
    ...actual,
    getUserPlan: vi.fn(async () => ({
      plan: "free" as const,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      planExpiresAt: null,
    })),
    getUserBackups: vi.fn(async () => []),
    getBankConnections: vi.fn(async () => []),
    getUserMonths: vi.fn(async () => []),
    getNotifications: vi.fn(async () => []),
    getUnreadNotificationCount: vi.fn(async () => 0),
    checkAndCreateMetaNotifications: vi.fn(async () => ({
      expiring: [],
      expired: [],
    })),
    markAllNotificationsRead: vi.fn(async () => undefined),
  };
});

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@nexo.com`,
      name: `Usuario ${userId}`,
      loginMethod: "clerk",
      role: "user",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      planExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("NEXO Finance - Fases 2, 3 e 4", () => {
  describe("Planos", () => {
    it("retorna plano gratuito por padrao", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const plan = await caller.finance.getPlan();
      expect(plan).toBeDefined();
      expect(plan.plan).toBe("free");
    });
  });

  describe("Backups", () => {
    it("lista backups sem erros", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const backups = await caller.finance.listBackups();
      expect(Array.isArray(backups)).toBe(true);
    });
  });

  describe("Conexoes Bancarias", () => {
    it("lista conexoes bancarias sem erros", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const connections = await caller.finance.getBankConnections();
      expect(Array.isArray(connections)).toBe(true);
    });

    it("conectar banco requer plano premium", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.finance.connectBank({
          bankName: "Nubank",
          bankCode: "260",
          accountType: "checking",
          maskedAccount: "1234",
        })
      ).rejects.toThrow();
    });
  });

  describe("Meses e Financas", () => {
    it("lista meses do usuario", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const months = await caller.finance.getUserMonths();
      expect(Array.isArray(months)).toBe(true);
    });
  });

  describe("Notificacoes", () => {
    it("lista notificacoes sem erros", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const notifs = await caller.notifications.list();
      expect(Array.isArray(notifs)).toBe(true);
    });

    it("retorna contagem de nao lidas", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.unreadCount();
      expect(typeof result.count).toBe("number");
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it("verifica metas e cria notificacoes", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.checkMetas();
      expect(result.created).toBeDefined();
      expect(Array.isArray(result.created.expiring)).toBe(true);
      expect(Array.isArray(result.created.expired)).toBe(true);
    });

    it("marca todas como lidas sem erros", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.markAllRead();
      expect(result.success).toBe(true);
    });
  });

  describe("Auth - Logout", () => {
    it("returns success on logout", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });
});
