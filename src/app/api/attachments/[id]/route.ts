import { NextResponse } from "next/server";
import { getAttachmentById } from "@/db/queries";
import { attachmentFilename, parseAttachmentDataUrl } from "@/lib/attachment";

export async function GET(_req: Request, ctx: RouteContext<"/api/attachments/[id]">) {
  const { id } = await ctx.params;
  const attachment = await getAttachmentById(Number(id));
  if (!attachment) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }

  const parsed = parseAttachmentDataUrl(attachment.url);
  if (!parsed) {
    return NextResponse.json({ error: "Format lampiran tidak dikenali." }, { status: 422 });
  }

  return new NextResponse(new Uint8Array(parsed.buffer), {
    headers: {
      "Content-Type": parsed.mimeType,
      "Content-Disposition": `attachment; filename="${attachmentFilename(attachment.txNo, attachment.id, attachment.url)}"`,
    },
  });
}
