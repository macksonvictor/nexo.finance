import { boolean, integer, pgEnum, pgTable, text, timestamp, varchar, doublePrecision, serial } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: pgEnum("role", ["user", "admin"]).default("user").notNull(),
  // Plano: free = até 5 caixas, premium = ilimitado
  plan: pgEnum("plan", ["free", "premium", "pro", "elite"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  planExpiresAt: timestamp("planExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Months table: each user has one record per month (YYYY-MM)
 */
export const months = pgTable("months", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  monthId: varchar("monthId", { length: 7 }).notNull(), // "YYYY-MM"
  income: doublePrecision("income").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Month = typeof months.$inferSelect;
export type InsertMonth = typeof months.$inferInsert;

/**
 * Caixas (budget boxes) table
 */
export const caixas = pgTable("caixas", {
  id: serial("id").primaryKey(),
  monthId: integer("monthId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("📦"),
  allocated: doublePrecision("allocated").notNull().default(0),
  spent: doublePrecision("spent").notNull().default(0),
  color: varchar("color", { length: 20 }).notNull().default("#F5F5F5"),
  category: pgEnum("category", ["essencial", "investimento", "lazer", "reserva", "outro"]).notNull().default("outro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // soft delete
});

export type Caixa = typeof caixas.$inferSelect;
export type InsertCaixa = typeof caixas.$inferInsert;

/**
 * Transactions table (includes transfers between caixas)
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  caixaId: integer("caixaId").notNull(),
  userId: integer("userId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: doublePrecision("amount").notNull(),
  type: pgEnum("type", ["expense", "income", "transfer"]).notNull().default("expense"),
  // For transfers: reference to destination caixa
  transferToCaixaId: integer("transferToCaixaId"),
  // For bank import: external reference
  externalRef: varchar("externalRef", { length: 255 }),
  bankName: varchar("bankName", { length: 100 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Metas (goals) table
 */
export const metas = pgTable("metas", {
  id: serial("id").primaryKey(),
  monthId: integer("monthId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: doublePrecision("targetAmount").notNull().default(0),
  currentAmount: doublePrecision("currentAmount").notNull().default(0),
  deadline: timestamp("deadline").notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("🎯"),
  color: varchar("color", { length: 20 }).notNull().default("#F5F5F5"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // soft delete
});

export type Meta = typeof metas.$inferSelect;
export type InsertMeta = typeof metas.$inferInsert;

/**
 * Monthly backups (snapshots) – auto-generated at month close
 */
export const monthlyBackups = pgTable("monthlyBackups", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  monthId: varchar("monthId", { length: 7 }).notNull(),
  snapshotJson: text("snapshotJson").notNull(), // full JSON snapshot
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlyBackup = typeof monthlyBackups.$inferSelect;
export type InsertMonthlyBackup = typeof monthlyBackups.$inferInsert;

/**
 * Connected bank accounts (Open Banking)
 */
export const bankConnections = pgTable("bankConnections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  bankCode: varchar("bankCode", { length: 20 }).notNull(),
  accountType: pgEnum("accountType", ["checking", "savings", "investment"]).notNull().default("checking"),
  maskedAccount: varchar("maskedAccount", { length: 30 }),
  isActive: boolean("isActive").notNull().default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;

/**
 * Notifications table – in-app alerts for goals, caixas, etc.
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: pgEnum("type", ["meta_expiring", "meta_expired", "caixa_limit", "backup_ready", "system"]).notNull().default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  // Optional reference to the related entity
  refId: integer("refId"),
  refType: varchar("refType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
