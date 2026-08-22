"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { deleteDivisionAction } from "@/lib/actions";

export function DeleteDivisionButton({ name, count }: { name: string; count: number }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDivisionAction(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Divisi dihapus.");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            className="flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
            title="Hapus divisi"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus divisi &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {count > 0
              ? `${count} transaksi yang sudah memakai divisi ini akan tetap menyimpan labelnya, tapi divisi ini tidak akan muncul lagi di pilihan transaksi baru.`
              : "Divisi ini belum dipakai transaksi manapun."}
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
  );
}
