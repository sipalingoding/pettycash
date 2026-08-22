"use client";

import { useState, useTransition } from "react";
import { Building2 } from "lucide-react";
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
import { addDivisionAction } from "@/lib/actions";

export function AddDivisionDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await addDivisionAction(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Divisi ditambahkan.");
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
            <Building2 className="size-4" />
            Tambah Divisi
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Divisi Baru</DialogTitle>
          <DialogDescription>
            Divisi baru langsung tersedia di semua daftar pilihan divisi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5 py-2">
          <Label htmlFor="div-name">Nama divisi</Label>
          <Input
            id="div-name"
            placeholder="mis. Marketing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan Divisi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
