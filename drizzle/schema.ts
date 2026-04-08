import { boolean, integer, pgEnum, pgTable, text, timestamp, varchar, doublePrecision, serial } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const planEnum = pgEnum("plan", ["free", "premium", "pro", "elite"]);
export const categoryEnum = pgEnum("category", ["essencial", "investimento", "lazer", "reserva", "outro"]);
export const transactionTypeEnum = pgEnum("transactionType", ["expense", "income", "transfer"]);
export const accountTypeEnum = pgEnum("accountType", ["checking", "savings", "investment"]);
export const notificationTypeEnum = pgEnum("notificationType", ["meta_expiring", "meta_expired", "caixa_limit", "backup_ready", "system"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  planExpiresAt: timestamp("planExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const months = pgTable("months", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  monthId: varchar("monthId", { length: 7 }).notNull(),
  income: doublePrecision("income").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Month = typeof months.$inferSelect;
export type InsertMonth = typeof months.$inferInsert;

export const caixas = pgTable("caixas", {
  id: serial("id").primaryKey(),
  monthId: integer("monthId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("box"),
  allocated: doublePrecision("allocated").notNull().default(0),
  spent: doublePrecision("spent").notNull().default(0),
  color: varchar("color", { length: 20 }).notNull().default("#F5F5F5"),
  category: categoryEnum("category").notNull().default("outro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});
export type Caixa = typeof caixas.$inferSelect;
export type InsertCaixa = typeof caixas.$inferInsert;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  caixaId: integer("caixaId").notNull(),
  userId: integer("userId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: doublePrecision("amount").notNull(),
  type: transactionTypeEnum("type").notNull().default("expense"),
  transferToCaixaId: integer("transferToCaixaId"),
  externalRef: varchar("externalRef", { length: 255 }),
  bankName: varchar("bankName", { length: 100 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const metas = pgTable("metas", {
  id: serial("id").primaryKey(),
  monthId: integer("monthId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: doublePrecision("targetAmount").notNull().default(0),
  currentAmount: doublePrecision("currentAmount").notNull().default(0),
  deadline: timestamp("deadline").notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("goal"),
  color: varchar("color", { length: 20 }).notNull().default("#F5F5F5"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});
export type Meta = typeof metas.$inferSelect;
export type InsertMeta = typeof metas.$inferInsert;

export const monthlyBackups = pgTable("monthlyBackups", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  monthId: varchar("monthId", { length: 7 }).notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MonthlyBackup = typeof monthlyBackups.$inferSelect;
export type InsertMonthlyBackup = typeof monthlyBackups.$inferInsert;

export const bankConnections = pgTable("bankConnections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  bankCode: varchar("bankCode", { length: 20 }).notNull(),
  accountType: accountTypeEnum("accountType").notNull().default("checking"),
  maskedAccount: varchar("maskedAccount", { length: 30 }),
  isActive: boolean("isActive").notNull().default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").notNull().default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  refId: integer("refId"),
  refType: varchar("refType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
