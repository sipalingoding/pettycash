export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB

const DATA_URL_RE = /^data:([\w./+-]+);base64,([\s\S]*)$/;

function extFromMimeType(mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "jpg";
  return subtype === "jpeg" ? "jpg" : subtype;
}

export function attachmentFilename(txNo: number, index: number, url: string): string {
  const match = DATA_URL_RE.exec(url);
  const ext = match ? extFromMimeType(match[1]) : "jpg";
  return `lampiran-transaksi-${txNo}-${index}.${ext}`;
}

/** Decodes a `data:` URI attachment into raw bytes + MIME type, for serving as a real file download. */
export function parseAttachmentDataUrl(url: string): { mimeType: string; buffer: Buffer } | null {
  const match = DATA_URL_RE.exec(url);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}
