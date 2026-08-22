import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReportData } from "@/db/queries";
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

  const data = await getReportData(from, to, txNoFrom, txNoTo);
  const buffer = await renderToBuffer(
    <KasKecilReportDocument data={data} dateFrom={from} dateTo={to} targetFloat={targetFloat} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-kas-kecil-${from}_sd_${to}.pdf"`,
    },
  });
}
