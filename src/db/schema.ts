import {
  pgTable,
  serial,
  integer,
  date,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    // mirrors the ledger's "No." column — stable, human-facing, unique
    txNo: integer("tx_no").notNull().unique(),
    date: date("date", { mode: "string" }).notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("Tanpa Kategori"),
    division: text("division").notNull().default("Tanpa Divisi"),
    amountIn: numeric("amount_in", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    amountOut: numeric("amount_out", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    // running balance snapshot at the time of this transaction
    balance: numeric("balance", { precision: 14, scale: 2, mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transactions_date_idx").on(table.date),
    index("transactions_category_idx").on(table.category),
    index("transactions_division_idx").on(table.division),
  ]
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const transactionAttachments = pgTable(
  "transaction_attachments",
  {
    id: serial("id").primaryKey(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("transaction_attachments_transaction_id_idx").on(table.transactionId)]
);

export type TransactionAttachment = typeof transactionAttachments.$inferSelect;
export type NewTransactionAttachment = typeof transactionAttachments.$inferInsert;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Division = typeof divisions.$inferSelect;
export type NewDivision = typeof divisions.$inferInsert;
