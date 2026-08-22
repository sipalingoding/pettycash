"use server";

import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, divisions, transactions } from "@/db/schema";
import { getCurrentBalance, getNextTxNo } from "@/db/queries";
import { UNCATEGORIZED } from "@/lib/categories";
import { UNASSIGNED_DIVISION } from "@/lib/divisions";
import { parseTransactionWorkbook } from "@/lib/import";
import { createSessionToken, verifyCredentials } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_COOKIE = "session";

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  if (!email.trim() || !password) {
    return { ok: false, error: "Email dan password wajib diisi." };
  }
  if (!verifyCredentials(email, password)) {
    return { ok: false, error: "Email atau password salah." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/laporan");
  revalidatePath("/kategori");
  revalidatePath("/divisi");
}

export type CreateTransactionInput = {
  date: string;
  description: string;
  category: string;
  division: string;
  type: "masuk" | "keluar";
  nominal: number;
  attachmentUrl?: string | null;
};

export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ActionResult> {
  const description = input.description.trim();
  if (!description) return { ok: false, error: "Keterangan wajib diisi." };
  if (!(input.nominal > 0)) {
    return { ok: false, error: "Nominal harus lebih dari 0." };
  }
  if (!input.date) return { ok: false, error: "Tanggal wajib diisi." };

  const category = input.category.trim() || UNCATEGORIZED;
  const division = input.division.trim() || UNASSIGNED_DIVISION;
  const currentBalance = await getCurrentBalance();
  const newBalance =
    input.type === "masuk" ? currentBalance + input.nominal : currentBalance - input.nominal;
  const txNo = await getNextTxNo();

  await db.insert(transactions).values({
    txNo,
    date: input.date,
    description,
    category,
    division,
    amountIn: input.type === "masuk" ? input.nominal : 0,
    amountOut: input.type === "keluar" ? input.nominal : 0,
    balance: newBalance,
    attachmentUrl: input.attachmentUrl || null,
  });

  revalidateAll();
  return { ok: true };
}

export type UpdateTransactionInput = {
  txNo: number;
  date?: string;
  description?: string;
  category?: string;
  division?: string;
  type?: "masuk" | "keluar";
  nominal?: number;
  attachmentUrl?: string | null;
};

export async function updateTransactionAction(
  input: UpdateTransactionInput
): Promise<ActionResult> {
  const patch: Partial<typeof transactions.$inferInsert> = { updatedAt: new Date() };

  if (input.date !== undefined) {
    if (!input.date) return { ok: false, error: "Tanggal wajib diisi." };
    patch.date = input.date;
  }
  if (input.description !== undefined) {
    const description = input.description.trim();
    if (!description) return { ok: false, error: "Keterangan wajib diisi." };
    patch.description = description;
  }
  if (input.category !== undefined) {
    patch.category = input.category.trim() || UNCATEGORIZED;
  }
  if (input.division !== undefined) {
    patch.division = input.division.trim() || UNASSIGNED_DIVISION;
  }
  if (input.attachmentUrl !== undefined) {
    patch.attachmentUrl = input.attachmentUrl || null;
  }

  // `type`/`nominal` change amount_in/amount_out together, so a partial edit (only one
  // of the two) still needs the row's current values to fill in the other side.
  let recompute = false;
  if (input.type !== undefined || input.nominal !== undefined) {
    if (input.nominal !== undefined && !(input.nominal > 0)) {
      return { ok: false, error: "Nominal harus lebih dari 0." };
    }
    const [current] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.txNo, input.txNo))
      .limit(1);
    if (!current) return { ok: false, error: "Transaksi tidak ditemukan." };

    const type = input.type ?? (current.amountIn > 0 ? "masuk" : "keluar");
    const nominal = input.nominal ?? (current.amountIn > 0 ? current.amountIn : current.amountOut);
    patch.amountIn = type === "masuk" ? nominal : 0;
    patch.amountOut = type === "keluar" ? nominal : 0;
    recompute = true;
  }

  await db.update(transactions).set(patch).where(eq(transactions.txNo, input.txNo));
  if (recompute) await recomputeBalances();

  revalidateAll();
  return { ok: true };
}

export async function removeAttachmentAction(txNo: number): Promise<ActionResult> {
  await db
    .update(transactions)
    .set({ attachmentUrl: null, updatedAt: new Date() })
    .where(eq(transactions.txNo, txNo));
  revalidateAll();
  return { ok: true };
}

// `balance` is a running snapshot ordered by txNo — any insert/delete outside the
// normal append-at-the-end flow leaves later rows' stored balance stale, so this
// recomputes the whole column from amount_in/amount_out in one pass.
async function recomputeBalances() {
  await db.execute(sql`
    update transactions t
    set balance = sub.running
    from (
      select id, sum(amount_in - amount_out) over (order by tx_no) as running
      from transactions
    ) sub
    where t.id = sub.id
  `);
}

export async function deleteTransactionAction(txNo: number): Promise<ActionResult> {
  await db.delete(transactions).where(eq(transactions.txNo, txNo));
  await recomputeBalances();
  revalidateAll();
  return { ok: true };
}

export async function addCategoryAction(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama kategori wajib diisi." };

  const [existing] = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.name, trimmed))
    .limit(1);
  if (existing) return { ok: false, error: "Kategori ini sudah ada." };

  await db.insert(categories).values({ name: trimmed });
  revalidateAll();
  return { ok: true };
}

export async function deleteCategoryAction(name: string): Promise<ActionResult> {
  if (name === UNCATEGORIZED) {
    return { ok: false, error: "Kategori default ini tidak bisa dihapus." };
  }
  await db.delete(categories).where(eq(categories.name, name));
  revalidateAll();
  return { ok: true };
}

export async function addDivisionAction(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama divisi wajib diisi." };

  const [existing] = await db
    .select({ name: divisions.name })
    .from(divisions)
    .where(eq(divisions.name, trimmed))
    .limit(1);
  if (existing) return { ok: false, error: "Divisi ini sudah ada." };

  await db.insert(divisions).values({ name: trimmed });
  revalidateAll();
  return { ok: true };
}

export async function editDivisionAction(id: number, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama divisi wajib diisi." };

  const [current] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
  if (!current) return { ok: false, error: "Divisi tidak ditemukan." };
  if (current.name === UNASSIGNED_DIVISION) {
    return { ok: false, error: "Divisi default ini tidak bisa diubah." };
  }
  if (current.name === trimmed) return { ok: true };

  const [clash] = await db
    .select({ name: divisions.name })
    .from(divisions)
    .where(eq(divisions.name, trimmed))
    .limit(1);
  if (clash) return { ok: false, error: "Divisi ini sudah ada." };

  await db.update(divisions).set({ name: trimmed }).where(eq(divisions.id, id));
  await db.update(transactions).set({ division: trimmed }).where(eq(transactions.division, current.name));

  revalidateAll();
  return { ok: true };
}

export async function deleteDivisionAction(name: string): Promise<ActionResult> {
  if (name === UNASSIGNED_DIVISION) {
    return { ok: false, error: "Divisi default ini tidak bisa dihapus." };
  }
  await db.delete(divisions).where(eq(divisions.name, name));
  revalidateAll();
  return { ok: true };
}

export type ImportResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      newCategories: string[];
      newDivisions: string[];
    }
  | { ok: false; error: string };

export async function importTransactionsAction(formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  const mode = formData.get("mode") === "replace" ? "replace" : "append";

  if (!(file instanceof File)) {
    return { ok: false, error: "Tidak ada file yang dikirim." };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: "File harus berformat .xlsx." };
  }

  const [{ count: existingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions);

  if (mode === "replace") {
    await db.delete(transactions);
  }
  const isEmptyLedger = mode === "replace" || existingCount === 0;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, skipped, errors } = await parseTransactionWorkbook(buffer, isEmptyLedger);

  if (rows.length === 0) {
    return { ok: false, error: errors[0] ?? "Tidak ada transaksi valid yang ditemukan di file ini." };
  }

  const [existingCategoryRows, existingDivisionRows] = await Promise.all([
    db.select({ name: categories.name }).from(categories),
    db.select({ name: divisions.name }).from(divisions),
  ]);
  const existingCategories = new Set(existingCategoryRows.map((c) => c.name));
  const existingDivisions = new Set(existingDivisionRows.map((d) => d.name));
  const newCategories = new Set<string>();
  const newDivisions = new Set<string>();

  let nextTxNo = await getNextTxNo();
  const values = rows.map((r) => {
    if (!existingCategories.has(r.category)) newCategories.add(r.category);
    if (!existingDivisions.has(r.division)) newDivisions.add(r.division);
    return {
      txNo: nextTxNo++,
      date: r.date,
      description: r.description,
      category: r.category,
      division: r.division,
      amountIn: r.amountIn,
      amountOut: r.amountOut,
      balance: 0, // placeholder — recomputeBalances() fixes every row below
    };
  });

  const BATCH_SIZE = 300;
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    await db.insert(transactions).values(values.slice(i, i + BATCH_SIZE));
  }

  for (const name of newCategories) {
    await db.insert(categories).values({ name }).onConflictDoNothing();
  }
  for (const name of newDivisions) {
    await db.insert(divisions).values({ name }).onConflictDoNothing();
  }

  await recomputeBalances();
  revalidateAll();

  return {
    ok: true,
    imported: values.length,
    skipped,
    newCategories: [...newCategories].sort((a, b) => a.localeCompare(b, "id")),
    newDivisions: [...newDivisions].sort((a, b) => a.localeCompare(b, "id")),
  };
}
