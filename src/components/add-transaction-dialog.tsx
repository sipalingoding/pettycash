"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import { addAttachmentAction, createTransactionAction } from "@/lib/actions";
import { UNCATEGORIZED } from "@/lib/categories";
import { UNASSIGNED_DIVISION } from "@/lib/divisions";
import { formatNominalInput, rp } from "@/lib/format";
import { cn } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionDialog({
  currentBalance,
  categoryOptions,
  divisionOptions,
  insertAfterTxNo,
  triggerVariant = "default",
  triggerTitle,
}: {
  currentBalance: number;
  categoryOptions: string[];
  divisionOptions: string[];
  insertAfterTxNo?: number;
  triggerVariant?: "default" | "inline" | "icon";
  triggerTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState<string>(categoryOptions[0] ?? UNCATEGORIZED);
  const [division, setDivision] = useState<string>(divisionOptions[0] ?? UNASSIGNED_DIVISION);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [nominalDisplay, setNominalDisplay] = useState("");
  const [photos, setPhotos] = useState<{ key: string; file: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const nominal = Number(nominalDisplay.replace(/[^\d]/g, "")) || 0;
  const preview = type === "masuk" ? currentBalance + nominal : currentBalance - nominal;

  function reset() {
    setDate(todayIso());
    setCategory(categoryOptions[0] ?? UNCATEGORIZED);
    setDivision(divisionOptions[0] ?? UNASSIGNED_DIVISION);
    setDescription("");
    setType("keluar");
    setNominalDisplay("");
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createTransactionAction({
        date,
        description,
        category,
        division,
        type,
        nominal,
        insertAfterTxNo,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      for (const photo of photos) {
        const attachResult = await addAttachmentAction(result.txNo, photo.file);
        if (!attachResult.ok) {
          toast.error(`Gagal melampirkan ${photo.file.name}: ${attachResult.error}`);
        }
      }

      toast.success(insertAfterTxNo === undefined ? "Transaksi tersimpan." : "Transaksi disisipkan.");
      setOpen(false);
      reset();
    });
  }

  const isInsert = insertAfterTxNo !== undefined;
  const isInline = triggerVariant === "inline";
  const isIcon = triggerVariant === "icon";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={isInline ? "outline" : isIcon ? "ghost" : "default"}
            size={isInline ? "xs" : isIcon ? "icon-sm" : "default"}
            className={
              isInline
                ? "h-6 rounded-full border-dashed bg-card text-[12px] text-muted-foreground hover:border-primary hover:text-primary"
                : isIcon
                  ? "text-muted-foreground hover:bg-secondary hover:text-primary"
                : "shadow-[0_8px_18px_rgba(172,94,113,0.26)]"
            }
            title={triggerTitle}
            aria-label={triggerTitle}
          >
            <Plus className="size-4" />
            {isIcon ? null : isInline ? "Tambah" : "Transaksi Baru"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {isInsert ? "Sisipkan Transaksi" : "Catat Transaksi"}
          </DialogTitle>
          <DialogDescription>
            {isInsert
              ? `Entri baru akan masuk setelah transaksi #${insertAfterTxNo}; nomor setelahnya akan bergeser.`
              : "Entri baru akan langsung memperbarui saldo dan laporan."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tx-date">Tanggal</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tx-category">Kategori</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger id="tx-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-division">Divisi</Label>
            <Select value={division} onValueChange={(value) => value && setDivision(value)}>
              <SelectTrigger id="tx-division" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {divisionOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-desc">Keterangan</Label>
            <Input
              id="tx-desc"
              placeholder="mis. Pembelian 9 Galon Aqua"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 rounded-2xl bg-muted p-1 sm:col-span-2">
            {(["masuk", "keluar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
                  type === t
                    ? "bg-card text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "masuk" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-nominal">
              {type === "masuk" ? "Nominal pemasukan" : "Nominal pengeluaran"}
            </Label>
            <div className="flex items-center gap-2 rounded-[13px] border border-input bg-card px-3.5 py-1">
              <span className="text-sm text-muted-foreground">Rp</span>
              <input
                id="tx-nominal"
                inputMode="numeric"
                placeholder="0"
                value={nominalDisplay}
                onChange={(e) => setNominalDisplay(formatNominalInput(e.target.value))}
                className="w-full bg-transparent py-1.5 font-variant-tabular text-base outline-none"
              />
            </div>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Lampiran foto struk (opsional, bisa lebih dari satu)</Label>
            <PhotoUpload
              photos={photos.map((p) => ({ key: p.key, url: p.previewUrl }))}
              onAdd={(files) =>
                setPhotos((prev) => [
                  ...prev,
                  ...files.map((file) => ({
                    key: crypto.randomUUID(),
                    file,
                    previewUrl: URL.createObjectURL(file),
                  })),
                ])
              }
              onRemove={(key) =>
                setPhotos((prev) => {
                  const target = prev.find((p) => p.key === key);
                  if (target) URL.revokeObjectURL(target.previewUrl);
                  return prev.filter((p) => p.key !== key);
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Foto disimpan langsung bersama data transaksi.
            </p>
          </div>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Saldo setelah entri ini: <span className="font-medium text-foreground">{rp(preview)}</span>
          </p>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Menyimpan…" : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
