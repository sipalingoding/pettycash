import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReportData } from "@/db/queries";
import type { ReportData } from "@/db/queries";
import { KasKecilReportDocument } from "@/lib/pdf/kas-kecil-report";
import { sanitizeLayout, type AttachmentLayout } from "@/lib/report-layout";

type ReportParams = {
  from: string;
  to: string;
  targetFloat: number;
  txNoFrom?: number;
  txNoTo?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txFromRaw = searchParams.get("txFrom");
  const txToRaw = searchParams.get("txTo");

  return renderReport({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    targetFloat: Number(searchParams.get("target")) || 0,
    txNoFrom: txFromRaw ? Number(txFromRaw) : undefined,
    txNoTo: txToRaw ? Number(txToRaw) : undefined,
  });
}

/** Same report as GET, plus attachment positions from the preview editor (too large for a query string). */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  return renderReport(
    {
      from: typeof body.from === "string" ? body.from : "",
      to: typeof body.to === "string" ? body.to : "",
      targetFloat: Number(body.target) || 0,
      txNoFrom: body.txFrom ? Number(body.txFrom) : undefined,
      txNoTo: body.txTo ? Number(body.txTo) : undefined,
    },
    sanitizeLayout(body.layout),
  );
}

async function renderReport(
  { from, to, targetFloat, txNoFrom, txNoTo }: ReportParams,
  layout?: AttachmentLayout,
) {
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
    <KasKecilReportDocument
      data={data}
      dateFrom={from}
      dateTo={to}
      targetFloat={targetFloat}
      layout={layout}
    />
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
