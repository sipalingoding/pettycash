"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, divisions, transactions } from "@/db/schema";
import { getCurrentBalance, getNextTxNo } from "@/db/queries";
import { UNCATEGORIZED } from "@/lib/categories";
import { UNASSIGNED_DIVISION } from "@/lib/divisions";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
  description?: string;
  category?: string;
  division?: string;
  attachmentUrl?: string | null;
};

export async function updateTransactionAction(
  input: UpdateTransactionInput
): Promise<ActionResult> {
  const patch: Partial<typeof transactions.$inferInsert> = { updatedAt: new Date() };

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

  await db.update(transactions).set(patch).where(eq(transactions.txNo, input.txNo));

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

export async function deleteTransactionAction(txNo: number): Promise<ActionResult> {
  await db.delete(transactions).where(eq(transactions.txNo, txNo));

  // `balance` is a running snapshot ordered by txNo — removing a row leaves every
  // later row's stored balance stale, so recompute the whole column in one pass.
  await db.execute(sql`
    update transactions t
    set balance = sub.running
    from (
      select id, sum(amount_in - amount_out) over (order by tx_no) as running
      from transactions
    ) sub
    where t.id = sub.id
  `);

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
