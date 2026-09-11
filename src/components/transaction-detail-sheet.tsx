"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ImageOff, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import type { PhotoItem } from "@/components/photo-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  addAttachmentAction,
  deleteTransactionAction,
  removeAttachmentAction,
  updateTransactionAction,
} from "@/lib/actions";
import { attachmentFilename } from "@/lib/attachment";
import { categoryColor } from "@/lib/categories";
import { divisionColor } from "@/lib/divisions";
import { formatNominalInput, parseNominalInput, rp, tglPanjang } from "@/lib/format";
import type { TransactionWithAttachments } from "@/db/queries";
import { cn } from "@/lib/utils";

export function TransactionDetailSheet({
  tx,
  open,
  onOpenChange,
  startInEdit = false,
  categoryOptions,
  divisionOptions,
}: {
  tx: TransactionWithAttachments;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startInEdit?: boolean;
  categoryOptions: string[];
  divisionOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(startInEdit);

  const txType = tx.amountIn > 0 ? "masuk" : "keluar";
  const txNominal = tx.amountIn > 0 ? tx.amountIn : tx.amountOut;

  const [date, setDate] = useState(tx.date);
  const [description, setDescription] = useState(tx.description);
  const [category, setCategory] = useState(tx.category);
  const [division, setDivision] = useState(tx.division);
  const [type, setType] = useState<"masuk" | "keluar">(txType);
  const [nominalDisplay, setNominalDisplay] = useState(
    formatNominalInput(String(txNominal), { fixedDecimals: true })
  );
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState(tx.attachments);
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  // Resync local state whenever this sheet is (re)opened for a possibly different/updated
  // row — adjusted during render, not in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  const [syncedKey, setSyncedKey] = useState(`${tx.txNo}:${open}`);
  const key = `${tx.txNo}:${open}`;
  if (syncedKey !== key) {
    setSyncedKey(key);
    if (open) {
      setEditing(startInEdit);
      setDate(tx.date);
      setDescription(tx.description);
      setCategory(tx.category);
      setDivision(tx.division);
      setType(txType);
      setNominalDisplay(formatNominalInput(String(txNominal), { fixedDecimals: true }));
      setError(null);
      setAttachments(tx.attachments);
      setRemovingIds([]);
    }
  }

  async function handleAddPhotos(files: File[]) {
    for (const file of files) {
      const result = await addAttachmentAction(tx.txNo, file);
      if (!result.ok) {
        toast.error(result.error);
        continue;
      }
      setAttachments((prev) => [...prev, result.attachment]);
    }
  }

  async function handleRemovePhoto(key: string) {
    const id = Number(key);
    setRemovingIds((prev) => [...prev, id]);
    const result = await removeAttachmentAction(id);
    setRemovingIds((prev) => prev.filter((x) => x !== id));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast.success("Foto dihapus.");
  }

  function handleSave() {
    setError(null);
    const nominal = parseNominalInput(nominalDisplay);
    startTransition(async () => {
      const result = await updateTransactionAction({
        txNo: tx.txNo,
        date,
        description,
        category,
        division,
        type,
        nominal,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Transaksi diperbarui.");
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransactionAction(tx.txNo);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Transaksi dihapus.");
      onOpenChange(false);
    });
  }

  const jenis = tx.amountIn > 0 ? "Pemasukan" : "Pengeluaran";
  const nominal = tx.amountIn > 0 ? tx.amountIn : tx.amountOut;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="text-[11px] tracking-[0.14em] text-primary/80 uppercase">
              Transaksi #{tx.txNo}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                title="Edit transaksi"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
          {editing ? (
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan"
              className="font-heading h-auto py-1 text-xl"
            />
          ) : (
            <SheetTitle className="font-heading text-xl leading-snug">
              {tx.description || "(tanpa keterangan)"}
            </SheetTitle>
          )}
          <SheetDescription className="sr-only">Detail transaksi #{tx.txNo}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-date">Tanggal</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select value={category} onValueChange={(value) => value && setCategory(value)}>
                  <SelectTrigger id="edit-category" className="w-full">
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

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="edit-division">Divisi</Label>
                <Select value={division} onValueChange={(value) => value && setDivision(value)}>
                  <SelectTrigger id="edit-division" className="w-full">
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

              <div className="col-span-2 flex gap-1.5 rounded-2xl bg-muted p-1">
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

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="edit-nominal">
                  {type === "masuk" ? "Nominal pemasukan" : "Nominal pengeluaran"}
                </Label>
                <div className="flex items-center gap-2 rounded-[13px] border border-input bg-card px-3.5 py-1">
                  <span className="text-sm text-muted-foreground">Rp</span>
                  <input
                    id="edit-nominal"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={nominalDisplay}
                    onChange={(e) => setNominalDisplay(formatNominalInput(e.target.value))}
                    onBlur={() => setNominalDisplay(formatNominalInput(nominalDisplay, { fixedDecimals: true }))}
                    className="w-full bg-transparent py-1.5 font-variant-tabular text-base outline-none"
                  />
                </div>
              </div>

              {error && <p className="col-span-2 text-sm text-destructive">{error}</p>}

              <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={pending}>
                  <X className="size-3.5" />
                  Batal
                </Button>
                <Button size="sm" onClick={handleSave} disabled={pending}>
                  {pending && <Loader2 className="size-3.5 animate-spin" />}
                  {pending ? "Menyimpan…" : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-3.5">
                <div className="text-[11px] text-muted-foreground">Tanggal</div>
                <div className="mt-1 text-sm">{tglPanjang(tx.date)}</div>
              </div>
              <div className="rounded-2xl bg-muted p-3.5">
                <div className="text-[11px] text-muted-foreground">Kategori</div>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="border-transparent"
                    style={{
                      background: `color-mix(in srgb, ${categoryColor(tx.category)} 15%, var(--card))`,
                      color: `color-mix(in srgb, ${categoryColor(tx.category)} 74%, var(--foreground))`,
                    }}
                  >
                    {tx.category}
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-muted p-3.5">
                <div className="text-[11px] text-muted-foreground">Divisi</div>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="border-transparent"
                    style={{
                      background: `color-mix(in srgb, ${divisionColor(tx.division)} 15%, var(--card))`,
                      color: `color-mix(in srgb, ${divisionColor(tx.division)} 74%, var(--foreground))`,
                    }}
                  >
                    {tx.division}
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-muted p-3.5">
                <div className="text-[11px] text-muted-foreground">{jenis}</div>
                <div className="font-heading mt-1 text-lg font-semibold">{rp(nominal)}</div>
              </div>
              <div className="rounded-2xl bg-muted p-3.5">
                <div className="text-[11px] text-muted-foreground">Saldo setelah</div>
                <div className="font-heading mt-1 text-lg font-semibold">{rp(tx.balance)}</div>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">
              Lampiran{attachments.length > 0 && ` (${attachments.length})`}
            </Label>
            {attachments.length === 0 && (
              <div className="mb-2.5 flex h-16 items-center gap-2 rounded-2xl border border-dashed border-border px-3.5 text-xs text-muted-foreground">
                <ImageOff className="size-4" />
                Belum ada lampiran
              </div>
            )}
            <PhotoUpload
              photos={attachments.map((a): PhotoItem => ({ key: String(a.id), url: a.url }))}
              onAdd={handleAddPhotos}
              onRemove={handleRemovePhoto}
              removingKeys={removingIds.map(String)}
              downloadFilename={(photo, index) =>
                attachmentFilename(tx.txNo, index + 1, photo.url)
              }
            />
          </div>
        </div>

        <SheetFooter>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              <Trash2 className="size-3.5" />
              Hapus Transaksi
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus transaksi #{tx.txNo}?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{tx.description || "(tanpa keterangan)"}&rdquo; akan dihapus permanen dan saldo
                  transaksi berikutnya akan dihitung ulang. Tindakan ini tidak bisa dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {pending ? "Menghapus…" : "Hapus"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
