"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, ImageOff, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/photo-upload";
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
import { deleteTransactionAction, removeAttachmentAction, updateTransactionAction } from "@/lib/actions";
import { attachmentFilename } from "@/lib/attachment";
import { categoryColor } from "@/lib/categories";
import { divisionColor } from "@/lib/divisions";
import { rp, tglPanjang } from "@/lib/format";
import type { Transaction } from "@/db/schema";

export function TransactionDetailSheet({
  tx,
  open,
  onOpenChange,
}: {
  tx: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [pending, startTransition] = useTransition();

  // Resync when the underlying attachment changes (e.g. after this update
  // revalidates the row) — adjusted during render, not in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [syncedUrl, setSyncedUrl] = useState(tx.attachmentUrl);
  if (syncedUrl !== tx.attachmentUrl) {
    setSyncedUrl(tx.attachmentUrl);
    setImgError(false);
  }

  const jenis = tx.amountIn > 0 ? "Pemasukan" : "Pengeluaran";
  const nominal = tx.amountIn > 0 ? tx.amountIn : tx.amountOut;

  function handlePhotoChange(url: string | null) {
    startTransition(async () => {
      const result = url
        ? await updateTransactionAction({ txNo: tx.txNo, attachmentUrl: url })
        : await removeAttachmentAction(tx.txNo);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setImgError(false);
      toast.success(url ? "Lampiran diperbarui." : "Lampiran dihapus.");
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <div className="text-[11px] tracking-[0.14em] text-primary/80 uppercase">
            Transaksi #{tx.txNo}
          </div>
          <SheetTitle className="font-heading text-xl leading-snug">
            {tx.description || "(tanpa keterangan)"}
          </SheetTitle>
          <SheetDescription className="sr-only">Detail transaksi #{tx.txNo}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
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

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Lampiran</Label>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="flex h-[170px] items-center justify-center bg-muted">
                {tx.attachmentUrl && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tx.attachmentUrl}
                    alt={`Lampiran transaksi ${tx.txNo}`}
                    className="h-full w-full object-contain"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageOff className="size-5" />
                    <span className="text-xs">
                      {tx.attachmentUrl ? "Tidak bisa menampilkan pratinjau" : "Belum ada lampiran"}
                    </span>
                  </div>
                )}
              </div>
              {tx.attachmentUrl && (
                <div className="flex gap-2 border-t border-border p-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a href={tx.attachmentUrl} download={attachmentFilename(tx.txNo, tx.attachmentUrl)}>
                        <Download className="size-3.5" />
                        Unduh
                      </a>
                    }
                  />
                </div>
              )}
            </div>

            <div className="mt-2.5">
              <PhotoUpload value={tx.attachmentUrl} onChange={handlePhotoChange} />
            </div>
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
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
