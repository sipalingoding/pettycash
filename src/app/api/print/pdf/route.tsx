import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReportData } from "@/db/queries";
import type { ReportData } from "@/db/queries";
import { KasKecilReportDocument } from "@/lib/pdf/kas-kecil-report";

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

  let data: ReportData;
  try {
    data = await getReportData(from, to, txNoFrom, txNoTo);
  } catch (err) {
    console.error("[print/pdf] Failed to load report data", err);
    return NextResponse.json({ error: "Gagal membaca data laporan." }, { status: 500 });
  }

  const document = (
    <KasKecilReportDocument data={data} dateFrom={from} dateTo={to} targetFloat={targetFloat} />
  );

  try {
    const buffer = await renderToBuffer(document);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-kas-kecil-${from}_sd_${to}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[print/pdf] Failed to generate report", err);
    return NextResponse.json({ error: "Gagal membuat PDF laporan." }, { status: 500 });
  }
}
