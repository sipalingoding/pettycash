"use client";

import { useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import { toast } from "sonner";
import { Download, ImagePlus, Loader2, X } from "lucide-react";
import { MAX_ATTACHMENT_SIZE } from "@/lib/attachment";
import { cn } from "@/lib/utils";

export type PhotoItem = { key: string; url: string };

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  removingKeys = [],
  downloadFilename,
}: {
  photos: PhotoItem[];
  onAdd: (files: File[]) => void | Promise<void>;
  onRemove: (key: string) => void | Promise<void>;
  removingKeys?: string[];
  downloadFilename?: (photo: PhotoItem, index: number) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
              {downloadFilename && (
                <a
                  href={photo.url}
                  download={downloadFilename(photo, index)}
                  title="Unduh foto"
                  className="text-white"
                >
                  <Download className="size-4" />
                </a>
              )}
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
    </div>
  );
}
