"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
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
import { editCoaAction } from "@/lib/actions";

export function EditCoaDialog({
  id,
  currentCode,
  currentName,
}: {
  id: number;
  currentCode: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(currentCode);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await editCoaAction(id, code, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("COA diperbarui.");
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setCode(currentCode);
          setName(currentName);
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
            title="Ubah COA"
          />
        }
      >
        <Pencil className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Ubah COA</DialogTitle>
          <DialogDescription>
            Jika kode diubah, transaksi yang memakai &ldquo;{currentCode}&rdquo; ikut berpindah ke kode baru.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="coa-edit-code">Kode akun</Label>
            <Input
              id="coa-edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coa-edit-name">Nama akun</Label>
            <Input
              id="coa-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
