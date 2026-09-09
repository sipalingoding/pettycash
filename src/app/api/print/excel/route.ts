import { NextResponse } from "next/server";
import { getReportData } from "@/db/queries";
import { buildKasKecilWorkbook } from "@/lib/excel/kas-kecil-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const targetFloat = Number(searchParams.get("target")) || 0;
  const txFromRaw = searchParams.get("txFrom");
  const txToRaw = searchParams.get("txTo");
  const txNoFrom = txFromRaw ? Number(txFromRaw) : undefined;
  const txNoTo = txToRaw ? Number(txToRaw) : undefined;

  if (!from || !to) {
    return NextResponse.json({ error: "Rentang tanggal (dari & sampai) wajib diisi." }, { status: 400 });
  }

  try {
    const data = await getReportData(from, to, txNoFrom, txNoTo);
    const buffer = await buildKasKecilWorkbook(data, from, to, targetFloat);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-kas-kecil-${from}_sd_${to}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[print/excel] Failed to generate report", err);
    return NextResponse.json({ error: "Gagal membuat Excel laporan." }, { status: 500 });
  }
}
