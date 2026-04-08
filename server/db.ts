import { eq, and, desc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { InsertUser, users, months, caixas, transactions, metas } from "../drizzle/schema";
import type { InsertMonth, InsertCaixa, InsertTransaction, InsertMeta } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.email === 'macksongaspar@gmail.com') {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Months ───────────────────────────────────────────────────────────────────

export async function getOrCreateMonth(userId: number, monthId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(months)
    .where(and(eq(months.userId, userId), eq(months.monthId, monthId))).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(months).values({ userId, monthId, income: 0 });
  const created = await db.select().from(months)
    .where(and(eq(months.userId, userId), eq(months.monthId, monthId))).limit(1);
  return created[0];
}

export async function updateMonthIncome(userId: number, monthId: string, income: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(months).set({ income }).where(and(eq(months.userId, userId), eq(months.monthId, monthId)));
}

export async function getUserMonths(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(months).where(eq(months.userId, userId)).orderBy(desc(months.monthId));
}

// ─── Caixas ───────────────────────────────────────────────────────────────────

export async function getCaixasByMonth(userId: number, monthDbId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Filtrar soft-deleted
  return db.select().from(caixas).where(and(eq(caixas.userId, userId), eq(caixas.monthId, monthDbId), isNull(caixas.deletedAt)));
}

export async function createCaixa(data: InsertCaixa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(caixas).values(data);
  const result = await db.select().from(caixas)
    .where(and(eq(caixas.userId, data.userId), eq(caixas.monthId, data.monthId!)))
    .orderBy(desc(caixas.createdAt)).limit(1);
  return result[0];
}

export async function updateCaixa(id: number, userId: number, data: Partial<typeof caixas.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(caixas).set(data).where(and(eq(caixas.id, id), eq(caixas.userId, userId)));
}

export async function deleteCaixaDb(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete: marca deletedAt em vez de remover fisicamente
  await db.update(caixas).set({ deletedAt: new Date() }).where(and(eq(caixas.id, id), eq(caixas.userId, userId)));
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionsByCaixa(caixaId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(transactions)
    .where(and(eq(transactions.caixaId, caixaId), eq(transactions.userId, userId)))
    .orderBy(desc(transactions.date));
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(transactions).values(data);
  const allTx = await db.select().from(transactions).where(eq(transactions.caixaId, data.caixaId!));
  const spent = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  await db.update(caixas).set({ spent }).where(eq(caixas.id, data.caixaId!));
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const tx = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (tx.length === 0) return;
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  const allTx = await db.select().from(transactions).where(eq(transactions.caixaId, tx[0].caixaId));
  const spent = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  await db.update(caixas).set({ spent }).where(eq(caixas.id, tx[0].caixaId));
}

// ─── Metas ────────────────────────────────────────────────────────────────────

export async function getMetasByMonth(userId: number, monthDbId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Filtrar soft-deleted
  return db.select().from(metas).where(and(eq(metas.userId, userId), eq(metas.monthId, monthDbId), isNull(metas.deletedAt)));
}

export async function createMeta(data: InsertMeta) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(metas).values(data);
  const result = await db.select().from(metas)
    .where(and(eq(metas.userId, data.userId), eq(metas.monthId, data.monthId!)))
    .orderBy(desc(metas.createdAt)).limit(1);
  return result[0];
}

export async function updateMetaDb(id: number, userId: number, data: Partial<typeof metas.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(metas).set(data).where(and(eq(metas.id, id), eq(metas.userId, userId)));
}

export async function deleteMetaDb(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete: marca deletedAt em vez de remover fisicamente
  await db.update(metas).set({ deletedAt: new Date() }).where(and(eq(metas.id, id), eq(metas.userId, userId)));
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export async function transferBetweenCaixas(
  userId: number,
  fromCaixaId: number,
  toCaixaId: number,
  amount: number,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  // Debit from source caixa
  await db.insert(transactions).values({
    caixaId: fromCaixaId,
    userId,
    description: `Transferência: ${description}`,
    amount,
    type: "transfer",
    transferToCaixaId: toCaixaId,
    date: now,
  });

  // Credit to destination caixa (as income)
  await db.insert(transactions).values({
    caixaId: toCaixaId,
    userId,
    description: `Recebido: ${description}`,
    amount,
    type: "income",
    transferToCaixaId: fromCaixaId,
    date: now,
  });

  // Update spent for source (debit)
  const fromTx = await db.select().from(transactions).where(eq(transactions.caixaId, fromCaixaId));
  const fromSpent = fromTx.filter(t => t.type === "expense" || t.type === "transfer").reduce((s, t) => s + t.amount, 0);
  await db.update(caixas).set({ spent: fromSpent }).where(eq(caixas.id, fromCaixaId));
}

export async function getAllTransactionsByUser(userId: number, monthDbId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (monthDbId) {
    // Get all caixas for this month
    const monthCaixas = await db.select().from(caixas)
      .where(and(eq(caixas.userId, userId), eq(caixas.monthId, monthDbId)));
    const caixaIds = monthCaixas.map(c => c.id);
    if (caixaIds.length === 0) return [];

    // Get all transactions for these caixas
    const allTx = await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
    return allTx.filter(t => caixaIds.includes(t.caixaId));
  }

  return db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date));
}

// ─── Monthly Backup ───────────────────────────────────────────────────────────

export async function createMonthlyBackup(userId: number, monthId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { monthlyBackups } = await import("../drizzle/schema");

  // Check if backup already exists
  const existing = await db.select().from(monthlyBackups)
    .where(and(eq(monthlyBackups.userId, userId), eq(monthlyBackups.monthId, monthId))).limit(1);
  if (existing.length > 0) return existing[0];

  // Build snapshot
  const month = await getOrCreateMonth(userId, monthId);
  if (!month) throw new Error("Month not found");
  const caixaList = await getCaixasByMonth(userId, month.id);
  const metaList = await getMetasByMonth(userId, month.id);
  const caixasWithTx = await Promise.all(
    caixaList.map(async (c) => {
      const txList = await getTransactionsByCaixa(c.id, userId);
      return { ...c, transactions: txList };
    })
  );

  const snapshot = JSON.stringify({ month, caixas: caixasWithTx, metas: metaList, backedUpAt: new Date() });

  await db.insert(monthlyBackups).values({ userId, monthId, snapshotJson: snapshot });
  const result = await db.select().from(monthlyBackups)
    .where(and(eq(monthlyBackups.userId, userId), eq(monthlyBackups.monthId, monthId))).limit(1);
  return result[0];
}

export async function getUserBackups(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { monthlyBackups } = await import("../drizzle/schema");
  return db.select({
    id: monthlyBackups.id,
    monthId: monthlyBackups.monthId,
    createdAt: monthlyBackups.createdAt,
  }).from(monthlyBackups)
    .where(eq(monthlyBackups.userId, userId))
    .orderBy(desc(monthlyBackups.createdAt));
}

export async function getBackupById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { monthlyBackups } = await import("../drizzle/schema");
  const result = await db.select().from(monthlyBackups)
    .where(and(eq(monthlyBackups.id, id), eq(monthlyBackups.userId, userId))).limit(1);
  return result[0] ?? null;
}

// ─── Bank Connections (Open Banking) ─────────────────────────────────────────

export async function getBankConnections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bankConnections } = await import("../drizzle/schema");
  return db.select().from(bankConnections).where(eq(bankConnections.userId, userId));
}

export async function addBankConnection(data: {
  userId: number;
  bankName: string;
  bankCode: string;
  accountType: "checking" | "savings" | "investment";
  maskedAccount?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bankConnections } = await import("../drizzle/schema");
  await db.insert(bankConnections).values({ ...data, isActive: true, lastSyncAt: new Date() });
  const result = await db.select().from(bankConnections)
    .where(and(eq(bankConnections.userId, data.userId), eq(bankConnections.bankCode, data.bankCode))).limit(1);
  return result[0];
}

export async function removeBankConnection(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bankConnections } = await import("../drizzle/schema");
  await db.delete(bankConnections).where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));
}

// ─── User Plan ────────────────────────────────────────────────────────────────

export async function getUserPlan(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    plan: users.plan,
    stripeCustomerId: users.stripeCustomerId,
    stripeSubscriptionId: users.stripeSubscriptionId,
    planExpiresAt: users.planExpiresAt,
  }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function updateUserPlan(userId: number, data: {
  plan: "free" | "premium";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planExpiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function countUserCaixas(userId: number, monthDbId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(caixas)
    .where(and(eq(caixas.userId, userId), eq(caixas.monthId, monthDbId)));
  return result.length;
}

// ─── Notifications ────────────────────────────────────────────────────────────
import { notifications, metas as metasTable } from "../drizzle/schema";
import type { InsertNotification } from "../drizzle/schema";

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
}

export async function getNotifications(userId: number, onlyUnread = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(notifications.userId, userId)];
  if (onlyUnread) conditions.push(eq(notifications.isRead, false));
  const result = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(notifications.createdAt);
  return result.reverse(); // newest first
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

/**
 * Check all metas for the user and create notifications for:
 * - Metas expiring in 3 days or less (meta_expiring)
 * - Metas already expired (meta_expired)
 * Avoids duplicates by checking if a notification already exists for the same refId + type today.
 */
export async function checkAndCreateMetaNotifications(userId: number) {
  const db = await getDb();
  if (!db) return { expiring: [], expired: [] };

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Get all metas for this user
  const allMetas = await db
    .select()
    .from(metasTable)
    .where(eq(metasTable.userId, userId));

  // Get existing notifications from today to avoid duplicates
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const existingToday = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        // createdAt >= today
      )
    );
  const existingKeys = new Set(
    existingToday
      .filter((n) => n.createdAt >= todayStart)
      .map((n) => `${n.type}-${n.refId}`)
  );

  const expiring: InsertNotification[] = [];
  const expired: InsertNotification[] = [];

  for (const meta of allMetas) {
    const deadline = new Date(meta.deadline);
    const isExpired = deadline < now;
    const isExpiringSoon = !isExpired && deadline <= threeDaysFromNow;
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isExpired) {
      const key = `meta_expired-${meta.id}`;
      if (!existingKeys.has(key)) {
        const notif: InsertNotification = {
          userId,
          type: "meta_expired",
          title: `Meta vencida: ${meta.name}`,
          message: `Sua meta "${meta.name}" venceu em ${deadline.toLocaleDateString("pt-BR")}. Progresso: ${Math.round((meta.currentAmount / meta.targetAmount) * 100)}%.`,
          isRead: false,
          refId: meta.id,
          refType: "meta",
        };
        await createNotification(notif);
        expired.push(notif);
      }
    } else if (isExpiringSoon) {
      const key = `meta_expiring-${meta.id}`;
      if (!existingKeys.has(key)) {
        const notif: InsertNotification = {
          userId,
          type: "meta_expiring",
          title: `Meta vencendo em breve: ${meta.name}`,
          message: `Sua meta "${meta.name}" vence em ${daysLeft === 0 ? "hoje" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""}`}. Progresso atual: ${Math.round((meta.currentAmount / meta.targetAmount) * 100)}%.`,
          isRead: false,
          refId: meta.id,
          refType: "meta",
        };
        await createNotification(notif);
        expiring.push(notif);
      }
    }
  }

  return { expiring, expired };
}
