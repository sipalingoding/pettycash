import { NextResponse } from "next/server";
import { getAggregates, getTransactions } from "@/db/queries";

function csvField(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const cat = searchParams.get("cat") ?? "Semua";
  const sort = (searchParams.get("sort") as "date" | "amountOut") ?? "date";
  const dir = (searchParams.get("dir") as "asc" | "desc") ?? "desc";

  const agg = await getAggregates();
  const topCategories = agg.categories.slice(0, 6).map((c) => c.category);

  const { rows } = await getTransactions({
    search: q,
    category: cat,
    topCategories,
    sortBy: sort,
    sortDir: dir,
    page: 1,
    pageSize: 100_000,
  });

  const lines = ["No,Tanggal,Keterangan,Kategori,Divisi,Pemasukan,Pengeluaran,Saldo,Lampiran"];
  for (const r of rows) {
    const lampiran = r.attachmentUrl ? `${origin}/api/attachments/${r.txNo}` : "";
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
  const filename = `petty-cash-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
