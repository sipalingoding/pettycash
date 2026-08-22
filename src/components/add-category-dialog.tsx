"use client";

import { useState, useTransition } from "react";
import { Tags } from "lucide-react";
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
import { addCategoryAction } from "@/lib/actions";

export function AddCategoryDialog() {
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
      const result = await addCategoryAction(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Kategori ditambahkan.");
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
            <Tags className="size-4" />
            Tambah Kategori
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Kategori Baru</DialogTitle>
          <DialogDescription>
            Kategori baru langsung tersedia di semua daftar pilihan kategori.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5 py-2">
          <Label htmlFor="cat-name">Nama kategori</Label>
          <Input
            id="cat-name"
            placeholder="mis. Biaya Konsumsi Rapat"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan Kategori"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
