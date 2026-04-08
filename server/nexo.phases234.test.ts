import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@nexo.com`,
      name: `Usuário ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

describe("NEXO Finance – Fases 2, 3 e 4", () => {
  describe("Planos", () => {
    it("retorna plano gratuito por padrão", async () => {
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

  describe("Conexões Bancárias", () => {
    it("lista conexões bancárias sem erros", async () => {
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

  describe("Meses e Finanças", () => {
    it("lista meses do usuário", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const months = await caller.finance.getUserMonths();
      expect(Array.isArray(months)).toBe(true);
    });
  });

  describe("Notificações", () => {
    it("lista notificações sem erros", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const notifs = await caller.notifications.list();
      expect(Array.isArray(notifs)).toBe(true);
    });

    it("retorna contagem de não lidas", async () => {
      const { ctx } = createAuthContext(99);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.unreadCount();
      expect(typeof result.count).toBe("number");
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it("verifica metas e cria notificações", async () => {
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

  describe("Auth – Logout", () => {
    it("clears session cookie on logout", async () => {
      const { ctx } = createAuthContext(99);
      const cleared: string[] = [];
      ctx.res.clearCookie = (name: string) => { cleared.push(name); };
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
      expect(cleared.length).toBe(1);
    });
  });
});
