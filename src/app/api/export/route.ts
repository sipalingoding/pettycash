import { NextResponse } from "next/server";
import { getAggregates, getTransactions } from "@/db/queries";

function csvField(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const cat = searchParams.get("cat") ?? "Semua";
  const year = searchParams.get("year") ?? "Semua";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const txFromRaw = searchParams.get("txFrom");
  const txToRaw = searchParams.get("txTo");
  const txNoFrom = txFromRaw ? Number(txFromRaw) : undefined;
  const txNoTo = txToRaw ? Number(txToRaw) : undefined;
  const sort = (searchParams.get("sort") as "date" | "amountOut") ?? "date";
  const dir = (searchParams.get("dir") as "asc" | "desc") ?? "desc";

  const agg = await getAggregates(year);
  const topCategories = agg.categories.slice(0, 6).map((c) => c.category);

  const { rows } = await getTransactions({
    search: q,
    category: cat,
    topCategories,
    year,
    dateFrom,
    dateTo,
    txNoFrom,
    txNoTo,
    sortBy: sort,
    sortDir: dir,
    page: 1,
    pageSize: 100_000,
  });

  const lines = ["No,Tanggal,Keterangan,Kategori,Divisi,Pemasukan,Pengeluaran,Saldo,Lampiran"];
  for (const r of rows) {
    const lampiran = r.attachmentCount > 0 ? `${r.attachmentCount} foto` : "";
    lines.push(
      [
        r.txNo,
        r.date,
        csvField(r.description),
        csvField(r.category),
        csvField(r.division),
        r.amountIn,
        r.amountOut,
        r.balance,
        csvField(lampiran),
      ].join(",")
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename =
    dateFrom || dateTo
      ? `petty-cash-${dateFrom || "awal"}_sd_${dateTo || "akhir"}.csv`
      : `petty-cash-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
