import { NextResponse } from "next/server";
import { getTransactionByNo } from "@/db/queries";
import { attachmentFilename, parseAttachmentDataUrl } from "@/lib/attachment";

export async function GET(_req: Request, ctx: RouteContext<"/api/attachments/[txNo]">) {
  const { txNo } = await ctx.params;
  const tx = await getTransactionByNo(Number(txNo));
  if (!tx?.attachmentUrl) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }

  const parsed = parseAttachmentDataUrl(tx.attachmentUrl);
  if (!parsed) {
    return NextResponse.json({ error: "Format lampiran tidak dikenali." }, { status: 422 });
  }

  return new NextResponse(new Uint8Array(parsed.buffer), {
    headers: {
      "Content-Type": parsed.mimeType,
      "Content-Disposition": `attachment; filename="${attachmentFilename(tx.txNo, tx.attachmentUrl)}"`,
    },
  });
}
