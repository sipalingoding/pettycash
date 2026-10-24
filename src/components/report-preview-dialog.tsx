"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { Download, Eye, ImageOff, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReportAttachmentsAction } from "@/lib/actions";
import { downloadFile, fetchFile } from "@/lib/download-file";
import {
  CANVAS_HEIGHT,
  CANVAS_INSET,
  CANVAS_WIDTH,
  FRAME_BORDER,
  MIN_IMAGE_SIZE,
  PAGE_HEIGHT,
  PAGE_PADDING,
  PAGE_WIDTH,
  defaultPageLayout,
  groupReportAttachments,
  type AttachmentBox,
  type AttachmentLayout,
} from "@/lib/report-layout";
import { cn } from "@/lib/utils";

export type ReportRequest = {
  from: string;
  to: string;
  target: number;
  txFrom?: number;
  txTo?: number;
};

type PreviewAttachment = {
  id: number;
  transactionDescription: string | null;
  src: string;
  aspectRatio: number;
};

type PreviewPage = { description: string; items: PreviewAttachment[] };

const MAX_PAGE_DISPLAY_WIDTH = 620;

function loadAspectRatio(src: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
    img.onerror = () => resolve(1);
    img.src = src;
  });
}

function clampBox(box: AttachmentBox): AttachmentBox {
  return {
    ...box,
    x: Math.min(Math.max(box.x, 0), CANVAS_WIDTH - box.w),
    y: Math.min(Math.max(box.y, 0), CANVAS_HEIGHT - box.h),
  };
}

/** Resizes from the bottom-right corner, keeping the image's aspect ratio and the box on the page. */
function resizeBox(start: AttachmentBox, dx: number): AttachmentBox {
  const ratio = start.h / start.w;
  const maxW = Math.min(CANVAS_WIDTH - start.x, (CANVAS_HEIGHT - start.y) / ratio);
  const w = Math.min(Math.max(start.w + dx, MIN_IMAGE_SIZE), maxW);
  return { ...start, w, h: w * ratio };
}

export function ReportPreviewDialog({
  request,
  disabled,
  layout,
  onLayoutChange,
}: {
  request: ReportRequest;
  disabled: boolean;
  layout: AttachmentLayout;
  onLayoutChange: Dispatch<SetStateAction<AttachmentLayout>>;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"pdf" | "edit">("pdf");
  const [pages, setPages] = useState<PreviewPage[] | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_DISPLAY_WIDTH);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pdfRequestRef = useRef(0);

  const scale = pageWidth / PAGE_WIDTH;

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  function measureContainer(node: HTMLDivElement | null) {
    resizeObserverRef.current?.disconnect();
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.min(entry.contentRect.width - 32, MAX_PAGE_DISPLAY_WIDTH));
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }

  function pdfInit(currentLayout: AttachmentLayout): RequestInit {
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, layout: currentLayout }),
    };
  }

  async function renderPdf(currentLayout: AttachmentLayout) {
    const requestId = ++pdfRequestRef.current;
    setPdfLoading(true);
    try {
      const { blob } = await fetchFile("/api/print/pdf", pdfInit(currentLayout));
      if (requestId !== pdfRequestRef.current) return;
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (requestId === pdfRequestRef.current) {
        toast.error(err instanceof Error ? err.message : "Gagal membuat pratinjau.");
      }
    } finally {
      if (requestId === pdfRequestRef.current) setPdfLoading(false);
    }
  }

  async function loadPreview() {
    setPages(null);
    setTab("pdf");
    try {
      const attachments = await getReportAttachmentsAction(
        request.from,
        request.to,
        request.txFrom,
        request.txTo,
      );
      const withSizes = await Promise.all(
        attachments.map(async (att) => {
          const src = `/api/attachments/${att.id}`;
          return { ...att, src, aspectRatio: await loadAspectRatio(src) };
        }),
      );
      const groups = groupReportAttachments(withSizes);

      // Pages the user hasn't arranged yet start from the same stacked placement the PDF uses.
      const next = { ...layout };
      groups.forEach((group, groupIndex) => {
        if (!group.items.every((att) => next[att.id])) {
          Object.assign(next, defaultPageLayout(group.items, groupIndex));
        }
      });
      onLayoutChange(next);
      setPages(groups);
      await renderPdf(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat pratinjau.");
      setPages([]);
    }
  }

  function handleTabChange(value: "pdf" | "edit") {
    setTab(value);
    setSelectedId(null);
    if (value === "pdf") renderPdf(layout);
  }

  function updateBox(id: number, box: AttachmentBox) {
    onLayoutChange((prev) => ({ ...prev, [id]: box }));
  }

  function resetPage(page: PreviewPage, groupIndex: number) {
    onLayoutChange((prev) => ({ ...prev, ...defaultPageLayout(page.items, groupIndex) }));
  }

  function startPointer(e: PointerEvent<HTMLElement>, id: number, mode: "move" | "resize") {
    const start = layout[id];
    if (!start) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);

    const target = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    target.setPointerCapture(e.pointerId);

    function handleMove(ev: globalThis.PointerEvent) {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      updateBox(
        id,
        mode === "move" ? clampBox({ ...start, x: start.x + dx, y: start.y + dy }) : resizeBox(start, dx),
      );
    }
    function handleEnd() {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleEnd);
      target.removeEventListener("pointercancel", handleEnd);
    }
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleEnd);
    target.addEventListener("pointercancel", handleEnd);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, id: number) {
    const box = layout[id];
    const step = e.shiftKey ? 10 : 1;
    const delta = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[e.key];
    if (!box || !delta) return;
    e.preventDefault();
    updateBox(id, clampBox({ ...box, x: box.x + delta[0], y: box.y + delta[1] }));
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFile("/api/print/pdf", "laporan-kas-kecil.pdf", pdfInit(layout));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh laporan.");
    } finally {
      setDownloading(false);
    }
  }

  const bodyHeight = "h-[calc(92dvh-11rem)]";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          loadPreview();
        } else {
          pdfRequestRef.current++;
          setPdfUrl(null);
          setPdfLoading(false);
          setSelectedId(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" disabled={disabled}>
            <Eye className="size-3.5" />
            Pratinjau
          </Button>
        }
      />
      <DialogContent className="max-h-[92dvh] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Pratinjau Laporan</DialogTitle>
          <DialogDescription>
            Atur posisi dan ukuran setiap lampiran, lalu cek hasil PDF sebelum diunduh.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="min-h-0">
          <TabsList>
            <TabsTrigger value="pdf">Hasil PDF</TabsTrigger>
            <TabsTrigger value="edit">Atur Lampiran</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf">
            <div className={cn("relative overflow-hidden rounded-lg bg-muted", bodyHeight)}>
              {pdfUrl && (
                <iframe src={pdfUrl} title="Pratinjau laporan" className="size-full" />
              )}
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/80 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Menyiapkan pratinjau…
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <div
              ref={measureContainer}
              onPointerDown={() => setSelectedId(null)}
              className={cn("overflow-y-auto rounded-lg bg-muted px-4 py-4", bodyHeight)}
            >
              {pages === null ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Memuat lampiran…
                </div>
              ) : pages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="size-5" />
                  Tidak ada lampiran pada periode ini.
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <p className="text-xs text-muted-foreground">
                    Seret gambar untuk memindahkan, tarik sudut kanan bawah untuk mengubah ukuran.
                    Tombol panah menggeser gambar terpilih (Shift untuk langkah besar).
                  </p>
                  {pages.map((page, groupIndex) => (
                    <div key={page.description + groupIndex} className="grid gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Halaman {groupIndex + 2}</span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => resetPage(page, groupIndex)}
                        >
                          <RotateCcw />
                          Atur ulang
                        </Button>
                      </div>
                      <div
                        className="relative bg-white shadow-sm ring-1 ring-black/10"
                        style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
                      >
                        <div
                          className="absolute"
                          style={{
                            inset: PAGE_PADDING * scale,
                            border: `${FRAME_BORDER * scale}px solid #1a237e`,
                          }}
                        />
                        <div
                          className="absolute leading-[1.2]"
                          style={{
                            fontFamily: "Helvetica, Arial, sans-serif",
                            left: CANVAS_INSET * scale,
                            top: CANVAS_INSET * scale,
                            width: CANVAS_WIDTH * scale,
                            height: CANVAS_HEIGHT * scale,
                          }}
                        >
                          {groupIndex === 0 && (
                            <p
                              className="font-bold text-black"
                              style={{ fontSize: 14 * scale, marginBottom: 15 * scale }}
                            >
                              LAMPIRAN BUKTI TRANSAKSI
                            </p>
                          )}
                          <p
                            className="text-center font-bold text-[#555]"
                            style={{ fontSize: 11 * scale }}
                          >
                            Lampiran: {page.description}
                          </p>

                          {page.items.map((att) => {
                            const box = layout[att.id];
                            if (!box) return null;
                            const selected = selectedId === att.id;
                            return (
                              <div
                                key={att.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Lampiran ${att.id}`}
                                onPointerDown={(e) => startPointer(e, att.id, "move")}
                                onFocus={() => setSelectedId(att.id)}
                                onKeyDown={(e) => handleKeyDown(e, att.id)}
                                className={cn(
                                  "absolute cursor-move touch-none outline-none select-none",
                                  selected
                                    ? "ring-2 ring-primary"
                                    : "hover:ring-1 hover:ring-primary/60",
                                )}
                                style={{
                                  left: box.x * scale,
                                  top: box.y * scale,
                                  width: box.w * scale,
                                  height: box.h * scale,
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att.src}
                                  alt=""
                                  draggable={false}
                                  className="pointer-events-none size-full object-contain"
                                />
                                {selected && (
                                  <span
                                    onPointerDown={(e) => startPointer(e, att.id, "resize")}
                                    title="Ubah ukuran"
                                    className="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border border-white bg-primary"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={downloading || pages === null}>
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {downloading ? "Menyiapkan…" : "Unduh PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
