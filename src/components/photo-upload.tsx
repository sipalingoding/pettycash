"use client";

import { useRef, useState, type DragEvent, type ClipboardEvent, type PointerEvent } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ImagePlus,
  Loader2,
  Crop as CropIcon,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_ATTACHMENT_SIZE } from "@/lib/attachment";
import { cn } from "@/lib/utils";

export type PhotoItem = { key: string; url: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

const FULL_CROP: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };

/** Cuts the selected region out of the image at its original resolution. */
async function cropImageToFile(image: HTMLImageElement, crop: PercentCrop): Promise<File> {
  const sx = Math.round((crop.x / 100) * image.naturalWidth);
  const sy = Math.round((crop.y / 100) * image.naturalHeight);
  const width = Math.max(1, Math.round((crop.width / 100) * image.naturalWidth));
  const height = Math.max(1, Math.round((crop.height / 100) * image.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(image, sx, sy, width, height, 0, 0, width, height);

  const sourceType = /^data:(image\/[\w.+-]+);/.exec(image.src)?.[1];
  const type = sourceType === "image/png" || sourceType === "image/webp" ? sourceType : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
  if (!blob) throw new Error("Gagal memotong gambar.");
  return new File([blob], `cropped-${Date.now()}.${blob.type.split("/")[1]}`, { type: blob.type });
}

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  removingKeys = [],
  downloadFilename,
  onReplace,
}: {
  photos: PhotoItem[];
  onAdd: (files: File[]) => void | Promise<void>;
  onRemove: (key: string) => void | Promise<void>;
  removingKeys?: string[];
  downloadFilename?: (photo: PhotoItem, index: number) => string;
  /** Enables cropping in the preview; receives the cropped image to store in place of the original. */
  onReplace?: (key: string, file: File) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewPhoto = previewIndex !== null ? photos[previewIndex] : undefined;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  // Lebar gambar saat pas di layar (zoom 100%), jadi acuan ukuran saat diperbesar.
  const [fitWidth, setFitWidth] = useState<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState<PercentCrop>(FULL_CROP);
  const [savingCrop, setSavingCrop] = useState(false);
  const cropImageRef = useRef<HTMLImageElement>(null);

  function openPreview(index: number) {
    setPreviewIndex(index);
    setZoom(MIN_ZOOM);
    setFitWidth(null);
    setCropping(false);
  }

  function startCrop() {
    setCrop(FULL_CROP);
    setCropping(true);
  }

  async function handleSaveCrop() {
    const image = cropImageRef.current;
    if (!image || !previewPhoto || !onReplace) return;
    if (crop.width <= 0 || crop.height <= 0) {
      toast.error("Pilih area yang ingin dipotong.");
      return;
    }
    setSavingCrop(true);
    try {
      await onReplace(previewPhoto.key, await cropImageToFile(image, crop));
      setCropping(false);
      setZoom(MIN_ZOOM);
      setFitWidth(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memotong gambar.");
    } finally {
      setSavingCrop(false);
    }
  }

  function changeZoom(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }

  function handlePanStart(e: PointerEvent<HTMLDivElement>) {
    const viewer = viewerRef.current;
    if (!viewer || zoom === MIN_ZOOM) return;
    e.preventDefault();
    viewer.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, left: viewer.scrollLeft, top: viewer.scrollTop };
  }

  function handlePanMove(e: PointerEvent<HTMLDivElement>) {
    const viewer = viewerRef.current;
    const drag = dragRef.current;
    if (!viewer || !drag) return;
    viewer.scrollLeft = drag.left - (e.clientX - drag.x);
    viewer.scrollTop = drag.top - (e.clientY - drag.y);
  }

  async function handleFiles(files: File[]) {
    const valid: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: file harus berupa gambar.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`${file.name}: ukuran maksimal 5MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setUploading(true);
    try {
      await onAdd(valid);
      toast.success(
        valid.length > 1
          ? `${valid.length} foto tersimpan.`
          : "Foto tersimpan.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files
      ? Array.from(e.dataTransfer.files)
      : [];
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          // Berikan nama default karena hasil paste clipboard biasanya tidak punya nama file asli
          const namedFile = new File([file], `pasted-image-${Date.now()}.png`, {
            type: file.type,
          });
          pastedFiles.push(namedFile);
        }
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      handleFiles(pastedFiles);
    }
  }

  return (
    <div
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors",
        isDragging && "bg-primary/5 ring-2 ring-primary/20 p-2",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          if (files.length > 0) handleFiles(files);
        }}
      />

      {photos.map((photo, index) => {
        const removing = removingKeys.includes(photo.key);
        return (
          <div
            key={photo.key}
            className="group relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt="Lampiran"
              className="size-full object-cover"
            />
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center gap-1.5 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100",
                removing && "opacity-100",
              )}
            >
              <button
                type="button"
                onClick={() => openPreview(index)}
                title="Lihat foto"
                className="text-white"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(photo.key)}
                disabled={removing}
                title="Hapus foto"
                className="text-white disabled:opacity-100"
              >
                {removing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60",
          isDragging && "border-primary text-primary",
        )}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <ImagePlus className="size-4" />
            <span className="text-[10px]">Tambah</span>
          </>
        )}
      </button>

      <Dialog
        open={previewPhoto !== undefined}
        onOpenChange={(open) => {
          if (!open && !savingCrop) {
            setPreviewIndex(null);
            setCropping(false);
          }
        }}
      >
        {previewPhoto && previewIndex !== null && (
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Lampiran {previewIndex + 1} dari {photos.length}
              </DialogTitle>
            </DialogHeader>
            {cropping ? (
              <div className="flex justify-center rounded-lg bg-muted">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  keepSelection
                  ruleOfThirds
                  disabled={savingCrop}
                  // ReactCrop's own CSS sets `max-height: inherit` on the image, which beats a
                  // Tailwind class on it — so the height cap must live on ReactCrop itself,
                  // otherwise portrait photos render at full height and overflow the dialog.
                  style={{ maxHeight: "min(65vh, calc(100dvh - 12rem))" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={cropImageRef}
                    src={previewPhoto.url}
                    alt={`Lampiran ${previewIndex + 1}`}
                  />
                </ReactCrop>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    title="Perkecil"
                    disabled={zoom <= MIN_ZOOM}
                    onClick={() => changeZoom(-ZOOM_STEP)}
                  >
                    <ZoomOut />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Kembalikan ke ukuran awal"
                    className="w-14 tabular-nums"
                    onClick={() => setZoom(MIN_ZOOM)}
                  >
                    {Math.round(zoom * 100)}%
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    title="Perbesar"
                    disabled={zoom >= MAX_ZOOM}
                    onClick={() => changeZoom(ZOOM_STEP)}
                  >
                    <ZoomIn />
                  </Button>
                </div>
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  <div
                    ref={viewerRef}
                    onPointerDown={handlePanStart}
                    onPointerMove={handlePanMove}
                    onPointerUp={() => (dragRef.current = null)}
                    onPointerCancel={() => (dragRef.current = null)}
                    onDoubleClick={() => setZoom((z) => (z === MIN_ZOOM ? 2 : MIN_ZOOM))}
                    className={cn(
                      "flex max-h-[70vh] overflow-auto",
                      zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewPhoto.url}
                      alt={`Lampiran ${previewIndex + 1}`}
                      draggable={false}
                      onLoad={(e) => setFitWidth(e.currentTarget.clientWidth)}
                      style={
                        zoom > MIN_ZOOM && fitWidth
                          ? { width: fitWidth * zoom, maxWidth: "none", maxHeight: "none" }
                          : undefined
                      }
                      className="m-auto max-h-[70vh] max-w-full object-contain select-none"
                    />
                  </div>
                  {photos.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute top-1/2 left-2 -translate-y-1/2"
                        title="Sebelumnya"
                        onClick={() =>
                          openPreview((previewIndex - 1 + photos.length) % photos.length)
                        }
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute top-1/2 right-2 -translate-y-1/2"
                        title="Berikutnya"
                        onClick={() => openPreview((previewIndex + 1) % photos.length)}
                      >
                        <ChevronRight />
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
            {cropping ? (
              <DialogFooter>
                <Button variant="outline" disabled={savingCrop} onClick={() => setCropping(false)}>
                  Batal
                </Button>
                <Button disabled={savingCrop} onClick={handleSaveCrop}>
                  {savingCrop ? <Loader2 className="size-3.5 animate-spin" /> : <CropIcon className="size-3.5" />}
                  {savingCrop ? "Menyimpan…" : "Simpan Potongan"}
                </Button>
              </DialogFooter>
            ) : (onReplace || downloadFilename) && (
              <DialogFooter>
                {onReplace && (
                  <Button variant="outline" onClick={startCrop}>
                    <CropIcon className="size-3.5" />
                    Potong
                  </Button>
                )}
                {downloadFilename && (
                  <Button
                    render={
                      <a
                        href={previewPhoto.url}
                        download={downloadFilename(previewPhoto, previewIndex)}
                      />
                    }
                    nativeButton={false}
                  >
                    <Download className="size-3.5" />
                    Unduh Foto
                  </Button>
                )}
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
