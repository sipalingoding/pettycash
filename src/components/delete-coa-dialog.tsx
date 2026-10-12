"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { deleteCoaAction } from "@/lib/actions";

export function DeleteCoaButton({
  id,
  code,
  name,
  count,
}: {
  id: number;
  code: string;
  name: string;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCoaAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("COA dihapus.");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            title="Hapus COA"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus COA &ldquo;{code} - {name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count > 0
              ? `${count} transaksi yang sudah memakai COA ini akan tetap menyimpan kodenya, tapi COA ini tidak akan muncul lagi di pilihan transaksi baru.`
              : "COA ini belum dipakai transaksi manapun."}
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
  );
}
