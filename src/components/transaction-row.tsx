"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Paperclip, Pencil, Trash2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { TransactionDetailSheet } from "@/components/transaction-detail-sheet";
import { deleteTransactionAction } from "@/lib/actions";
import { categoryColor, UNCATEGORIZED } from "@/lib/categories";
import { divisionColor } from "@/lib/divisions";
import { rp, tgl } from "@/lib/format";
import type { Transaction } from "@/db/schema";
import { cn } from "@/lib/utils";

export function TransactionRow({
  tx,
  categoryOptions,
  divisionOptions,
}: {
  tx: Transaction;
  categoryOptions: string[];
  divisionOptions: string[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [startInEdit, setStartInEdit] = useState(false);
  const [pending, startTransition] = useTransition();

  function openDetail(edit: boolean) {
    setStartInEdit(edit);
    setDetailOpen(true);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransactionAction(tx.txNo);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Transaksi dihapus.");
    });
  }

  const isUncat = tx.category === UNCATEGORIZED;

  return (
    <>
      <TableRow className="group">
        <TableCell className="text-muted-foreground font-variant-tabular">{tx.txNo}</TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">{tgl(tx.date)}</TableCell>
        <TableCell className="max-w-[280px]">
          <button
            onClick={() => openDetail(false)}
            className="block w-full truncate text-left hover:text-primary"
            title={tx.description || "(tanpa keterangan)"}
          >
            {tx.description || "(tanpa keterangan)"}
          </button>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn("max-w-[160px] truncate border-transparent", isUncat && "border-dashed border-current")}
            style={{
              background: `color-mix(in srgb, ${categoryColor(tx.category)} 15%, var(--card))`,
              color: `color-mix(in srgb, ${categoryColor(tx.category)} 74%, var(--foreground))`,
            }}
          >
            {tx.category}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="max-w-[140px] truncate border-transparent"
            style={{
              background: `color-mix(in srgb, ${divisionColor(tx.division)} 15%, var(--card))`,
              color: `color-mix(in srgb, ${divisionColor(tx.division)} 74%, var(--foreground))`,
            }}
          >
            {tx.division}
          </Badge>
        </TableCell>
        <TableCell className="text-income-foreground text-right font-variant-tabular">
          {tx.amountIn ? rp(tx.amountIn) : "—"}
        </TableCell>
        <TableCell className="text-expense-foreground text-right font-variant-tabular">
          {tx.amountOut ? rp(tx.amountOut) : "—"}
        </TableCell>
        <TableCell className="text-right font-variant-tabular font-medium">{rp(tx.balance)}</TableCell>
        <TableCell className="text-center">
          <button
            onClick={() => openDetail(false)}
            className={cn(
              "mx-auto flex size-7 items-center justify-center rounded-lg border",
              tx.attachmentUrl ? "border-secondary bg-secondary text-accent-foreground" : "border-border text-muted-foreground"
            )}
          >
            <Paperclip className="size-3.5" />
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => openDetail(true)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              title="Edit transaksi"
            >
              <Pencil className="size-3.5" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <button
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    title="Hapus transaksi"
                  />
                }
              >
                <Trash2 className="size-3.5" />
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
          </div>
        </TableCell>
      </TableRow>

      <TransactionDetailSheet
        tx={tx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        startInEdit={startInEdit}
        categoryOptions={categoryOptions}
        divisionOptions={divisionOptions}
      />
    </>
  );
}
