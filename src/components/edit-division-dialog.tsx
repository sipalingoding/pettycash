"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editDivisionAction } from "@/lib/actions";

export function EditDivisionDialog({ id, currentName }: { id: number; currentName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await editDivisionAction(id, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Divisi diperbarui.");
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName(currentName);
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            className="flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            title="Ubah nama divisi"
          />
        }
      >
        <Pencil className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Ubah Divisi</DialogTitle>
          <DialogDescription>
            Transaksi yang sudah memakai &ldquo;{currentName}&rdquo; ikut berpindah ke nama baru.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5 py-2">
          <Label htmlFor="div-edit-name">Nama divisi</Label>
          <Input
            id="div-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
