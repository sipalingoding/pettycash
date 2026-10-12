"use client";

import { useState, useTransition } from "react";
import { BookText, Loader2 } from "lucide-react";
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
import { addCoaAction } from "@/lib/actions";

export function AddCoaDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCode("");
    setName("");
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await addCoaAction(code, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("COA ditambahkan.");
      setOpen(false);
      reset();
    });
  }

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
          <Button variant="outline">
            <BookText className="size-4" />
            Tambah COA
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">COA Baru</DialogTitle>
          <DialogDescription>
            Akun baru langsung tersedia di pilihan COA saat mencatat transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="coa-code">Kode akun</Label>
            <Input
              id="coa-code"
              placeholder="mis. 6200.27"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="coa-name">Nama akun</Label>
            <Input
              id="coa-name"
              placeholder="mis. Biaya Kebersihan"
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
            {pending ? "Menyimpan…" : "Simpan COA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
