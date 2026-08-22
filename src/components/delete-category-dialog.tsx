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
import { deleteCategoryAction } from "@/lib/actions";

export function DeleteCategoryButton({ name, count }: { name: string; count: number }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Kategori dihapus.");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            className="flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
            title="Hapus kategori"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kategori &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {count > 0
              ? `${count} transaksi yang sudah memakai kategori ini akan tetap menyimpan labelnya, tapi kategori ini tidak akan muncul lagi di pilihan transaksi baru.`
              : "Kategori ini belum dipakai transaksi manapun."}
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
