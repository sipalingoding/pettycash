import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, divisions, transactions } from "./schema";

export type CategoryStat = {
  category: string;
  amountOut: number;
  amountIn: number;
  count: number;
};

export type MonthStat = {
  month: string; // "YYYY-MM"
  amountIn: number;
  amountOut: number;
  count: number;
};

export type Aggregates = {
  totalIn: number;
  totalOut: number;
  count: number;
  outCount: number;
  currentBalance: number;
  lastDate: string | null;
  categories: CategoryStat[];
  months: MonthStat[];
};

/** Single source of truth for dashboard, laporan, and kategori pages. */
export async function getAggregates(year?: string): Promise<Aggregates> {
  const yearFilter = year && year !== "Semua" ? sql`to_char(${transactions.date}, 'YYYY') = ${year}` : undefined;

  const [totals] = await db
    .select({
      totalIn: sql<number>`coalesce(sum(${transactions.amountIn}), 0)::float8`,
      totalOut: sql<number>`coalesce(sum(${transactions.amountOut}), 0)::float8`,
      count: sql<number>`count(*)::int`,
      outCount: sql<number>`count(*) filter (where ${transactions.amountOut} > 0)::int`,
    })
    .from(transactions)
    .where(yearFilter);

  const [latest] = await db
    .select({ balance: transactions.balance, date: transactions.date })
    .from(transactions)
    .where(yearFilter)
    .orderBy(desc(transactions.txNo))
    .limit(1);

  const categories = await db
    .select({
      category: transactions.category,
      amountOut: sql<number>`coalesce(sum(${transactions.amountOut}), 0)::float8`,
      amountIn: sql<number>`coalesce(sum(${transactions.amountIn}), 0)::float8`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(yearFilter)
    .groupBy(transactions.category)
    .orderBy(desc(sql`sum(${transactions.amountOut})`));

  const months = await db
    .select({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      amountIn: sql<number>`coalesce(sum(${transactions.amountIn}), 0)::float8`,
      amountOut: sql<number>`coalesce(sum(${transactions.amountOut}), 0)::float8`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(yearFilter)
    .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
    .orderBy(asc(sql`to_char(${transactions.date}, 'YYYY-MM')`));

  return {
    totalIn: totals?.totalIn ?? 0,
    totalOut: totals?.totalOut ?? 0,
    count: totals?.count ?? 0,
    outCount: totals?.outCount ?? 0,
    currentBalance: latest?.balance ?? 0,
    lastDate: latest?.date ?? null,
    categories,
    months,
  };
}

/** Distinct years present in the ledger, newest first — the source for the year filter. */
export async function getAvailableYears(): Promise<string[]> {
  const rows = await db
    .select({ year: sql<string>`to_char(${transactions.date}, 'YYYY')` })
    .from(transactions)
    .groupBy(sql`to_char(${transactions.date}, 'YYYY')`)
    .orderBy(desc(sql`to_char(${transactions.date}, 'YYYY')`));
  return rows.map((r) => r.year);
}

export type TransactionListParams = {
  search?: string;
  category?: string; // "Semua" | "Lainnya" | exact category name
  topCategories?: string[]; // used to resolve "Lainnya"
  division?: string; // "Semua" | exact division name
  type?: "masuk" | "keluar"; // undefined = both
  year?: string; // "Semua" | "YYYY"
  dateFrom?: string; // "YYYY-MM-DD", inclusive
  dateTo?: string; // "YYYY-MM-DD", inclusive
  txNoFrom?: number; // inclusive
  txNoTo?: number; // inclusive
  sortBy?: "date" | "amountOut";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function getTransactions(params: TransactionListParams) {
  const {
    search = "",
    category = "Semua",
    topCategories = [],
    division = "Semua",
    type,
    year = "Semua",
    dateFrom = "",
    dateTo = "",
    txNoFrom,
    txNoTo,
    sortBy = "date",
    sortDir = "desc",
    page = 1,
    pageSize = 40,
  } = params;

  const conditions = [];
  if (search.trim()) {
    conditions.push(ilike(transactions.description, `%${search.trim()}%`));
  }
  if (year !== "Semua") {
    conditions.push(sql`to_char(${transactions.date}, 'YYYY') = ${year}`);
  }
  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo) conditions.push(lte(transactions.date, dateTo));
  if (txNoFrom !== undefined) conditions.push(gte(transactions.txNo, txNoFrom));
  if (txNoTo !== undefined) conditions.push(lte(transactions.txNo, txNoTo));
  if (category !== "Semua") {
    if (category === "Lainnya" && topCategories.length) {
      conditions.push(
        sql`${transactions.category} not in (${sql.join(
          topCategories.map((c) => sql`${c}`),
          sql`, `
        )})`
      );
    } else if (category !== "Lainnya") {
      conditions.push(eq(transactions.category, category));
    }
  }
  if (division !== "Semua") {
    conditions.push(eq(transactions.division, division));
  }
  if (type === "masuk") conditions.push(sql`${transactions.amountIn} > 0`);
  if (type === "keluar") conditions.push(sql`${transactions.amountOut} > 0`);
  const where = conditions.length ? and(...conditions) : undefined;

  const orderColumn =
    sortBy === "amountOut" ? transactions.amountOut : transactions.date;
  const orderFn = sortDir === "asc" ? asc : desc;
  const tieBreak = sortDir === "asc" ? asc(transactions.txNo) : desc(transactions.txNo);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(transactions)
    .where(where);

  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(orderFn(orderColumn), tieBreak)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total: total ?? 0 };
}

export async function getTransactionByNo(txNo: number) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.txNo, txNo))
    .limit(1);
  return row ?? null;
}

export async function getNextTxNo(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${transactions.txNo}), 0)::int` })
    .from(transactions);
  return (row?.max ?? 0) + 1;
}

export async function getCurrentBalance(): Promise<number> {
  const [row] = await db
    .select({ balance: transactions.balance })
    .from(transactions)
    .orderBy(desc(transactions.txNo))
    .limit(1);
  return row?.balance ?? 0;
}

/** All known category names — the source for dropdowns and "add category" management. */
export async function getCategoryNames(): Promise<string[]> {
  const rows = await db.select({ name: categories.name }).from(categories);
  return rows.map((r) => r.name).sort((a, b) => a.localeCompare(b, "id"));
}

/** All known division names — the source for the transaction form's dropdown. */
export async function getDivisionNames(): Promise<string[]> {
  const rows = await db.select({ name: divisions.name }).from(divisions);
  return rows.map((r) => r.name).sort((a, b) => a.localeCompare(b, "id"));
}

export type ReportRow = {
  txNo: number;
  date: string;
  description: string;
  amountIn: number;
  amountOut: number;
  balance: number;
};

export type ReportData = {
  openingBalance: number;
  rows: ReportRow[];
  closingBalance: number;
};

/** Chronological ledger slice for the "Laporan Kas Kecil" print/export, with the running
 * balance carried in from just before the first included row so the report's Saldo column
 * stays absolute even when `txNoFrom`/`txNoTo` narrows the rows further within the date range. */
export async function getReportData(
  dateFrom?: string,
  dateTo?: string,
  txNoFrom?: number,
  txNoTo?: number
): Promise<ReportData> {
  const conditions = [];
  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo) conditions.push(lte(transactions.date, dateTo));
  if (txNoFrom !== undefined) conditions.push(gte(transactions.txNo, txNoFrom));
  if (txNoTo !== undefined) conditions.push(lte(transactions.txNo, txNoTo));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      txNo: transactions.txNo,
      date: transactions.date,
      description: transactions.description,
      amountIn: transactions.amountIn,
      amountOut: transactions.amountOut,
      balance: transactions.balance,
    })
    .from(transactions)
    .where(where)
    .orderBy(asc(transactions.date), asc(transactions.txNo));

  let openingBalance = 0;
  if (rows.length) {
    const first = rows[0];
    const [before] = await db
      .select({ balance: transactions.balance })
      .from(transactions)
      .where(
        sql`(${transactions.date} < ${first.date}) or (${transactions.date} = ${first.date} and ${transactions.txNo} < ${first.txNo})`
      )
      .orderBy(desc(transactions.date), desc(transactions.txNo))
      .limit(1);
    openingBalance = before?.balance ?? 0;
  } else if (dateFrom) {
    const [before] = await db
      .select({ balance: transactions.balance })
      .from(transactions)
      .where(sql`${transactions.date} < ${dateFrom}`)
      .orderBy(desc(transactions.date), desc(transactions.txNo))
      .limit(1);
    openingBalance = before?.balance ?? 0;
  }

  const closingBalance = rows.length ? rows[rows.length - 1].balance : openingBalance;

  return { openingBalance, rows, closingBalance };
}

export type DivisionStat = { id: number; name: string; count: number };

/** Divisions with their transaction counts, for the division management page. */
export async function getDivisionStats(): Promise<DivisionStat[]> {
  const counts = await db
    .select({
      division: transactions.division,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .groupBy(transactions.division);
  const countByName = new Map(counts.map((c) => [c.division, c.count]));

  const rows = await db.select({ id: divisions.id, name: divisions.name }).from(divisions);
  return rows
    .map((r) => ({ id: r.id, name: r.name, count: countByName.get(r.name) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
