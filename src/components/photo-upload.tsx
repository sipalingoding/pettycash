"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      onChange(dataUrl);
      toast.success("Foto tersimpan.");
    } catch {
      toast.error("Gagal membaca foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
        {uploading ? "Memproses…" : value ? "Ganti Foto" : "Unggah Foto"}
      </Button>
      {value && !uploading && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          <X className="size-3.5" />
          Hapus
        </Button>
      )}
    </div>
  );
}
