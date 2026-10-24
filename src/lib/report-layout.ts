/** Geometry shared by the PDF attachment pages and the preview editor, all in PDF points.
 * The "canvas" is the area inside the report frame where attachments are placed. */
export const PAGE_WIDTH = 595.28; // A4
export const PAGE_HEIGHT = 841.89;
export const PAGE_PADDING = 30;
export const FRAME_BORDER = 1.5;
export const FRAME_PADDING = 14;
export const CANVAS_INSET = PAGE_PADDING + FRAME_BORDER + FRAME_PADDING;
export const CANVAS_WIDTH = PAGE_WIDTH - 2 * CANVAS_INSET;
export const CANVAS_HEIGHT = PAGE_HEIGHT - 2 * CANVAS_INSET;

// Approximate height of the page title + caption, so default placement starts below them.
const HEADER_HEIGHT_FIRST_PAGE = 58;
const HEADER_HEIGHT = 26;
const DEFAULT_IMAGE_WIDTH = 350;
const IMAGE_GAP = 10;
export const MIN_IMAGE_SIZE = 30;

export type AttachmentBox = { x: number; y: number; w: number; h: number };
/** Keyed by attachment id. */
export type AttachmentLayout = Record<string, AttachmentBox>;

/** Attachments are printed one page per transaction description, in first-seen order. */
export function groupReportAttachments<T extends { transactionDescription: string | null }>(
  attachments: T[],
): { description: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const att of attachments) {
    const desc = att.transactionDescription || "Tanpa Keterangan";
    const items = groups.get(desc);
    if (items) items.push(att);
    else groups.set(desc, [att]);
  }
  return [...groups].map(([description, items]) => ({ description, items }));
}

/** Stacks images centered below the header, shrinking them all evenly if they'd overflow the page. */
export function defaultPageLayout(
  items: { id: number; aspectRatio: number }[],
  groupIndex: number,
): AttachmentLayout {
  const top = groupIndex === 0 ? HEADER_HEIGHT_FIRST_PAGE : HEADER_HEIGHT;
  const sizes = items.map(({ aspectRatio }) => {
    const w = Math.min(DEFAULT_IMAGE_WIDTH, CANVAS_WIDTH);
    return { w, h: w / aspectRatio };
  });

  const available = CANVAS_HEIGHT - top - IMAGE_GAP * Math.max(0, items.length - 1);
  const total = sizes.reduce((sum, s) => sum + s.h, 0);
  const scale = total > available ? available / total : 1;

  const layout: AttachmentLayout = {};
  let y = top;
  items.forEach((item, i) => {
    const w = sizes[i].w * scale;
    const h = sizes[i].h * scale;
    layout[item.id] = { x: (CANVAS_WIDTH - w) / 2, y, w, h };
    y += h + IMAGE_GAP;
  });
  return layout;
}

/** Keeps only well-formed boxes, clamped onto the canvas — the layout arrives from the client. */
export function sanitizeLayout(raw: unknown): AttachmentLayout {
  if (!raw || typeof raw !== "object") return {};
  const layout: AttachmentLayout = {};
  for (const [id, box] of Object.entries(raw as Record<string, unknown>)) {
    if (!box || typeof box !== "object") continue;
    const { x, y, w, h } = box as Record<string, unknown>;
    if (![x, y, w, h].every((n) => typeof n === "number" && Number.isFinite(n))) continue;
    const width = Math.min(Math.max(w as number, MIN_IMAGE_SIZE), CANVAS_WIDTH);
    const height = Math.min(Math.max(h as number, MIN_IMAGE_SIZE), CANVAS_HEIGHT);
    layout[id] = {
      x: Math.min(Math.max(x as number, 0), CANVAS_WIDTH - width),
      y: Math.min(Math.max(y as number, 0), CANVAS_HEIGHT - height),
      w: width,
      h: height,
    };
  }
  return layout;
}
