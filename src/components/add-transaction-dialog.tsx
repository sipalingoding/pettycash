"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import { createTransactionAction } from "@/lib/actions";
import { UNCATEGORIZED } from "@/lib/categories";
import { UNASSIGNED_DIVISION } from "@/lib/divisions";
import { rp } from "@/lib/format";
import { cn } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatNominal(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits).toLocaleString("id-ID") : "";
}

export function AddTransactionDialog({
  currentBalance,
  categoryOptions,
  divisionOptions,
}: {
  currentBalance: number;
  categoryOptions: string[];
  divisionOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState<string>(categoryOptions[0] ?? UNCATEGORIZED);
  const [division, setDivision] = useState<string>(divisionOptions[0] ?? UNASSIGNED_DIVISION);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [nominalDisplay, setNominalDisplay] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nominal = Number(nominalDisplay.replace(/[^\d]/g, "")) || 0;
  const preview = type === "masuk" ? currentBalance + nominal : currentBalance - nominal;

  function reset() {
    setDate(todayIso());
    setCategory(categoryOptions[0] ?? UNCATEGORIZED);
    setDivision(divisionOptions[0] ?? UNASSIGNED_DIVISION);
    setDescription("");
    setType("keluar");
    setNominalDisplay("");
    setAttachmentUrl(null);
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createTransactionAction({
        date,
        description,
        category,
        division,
        type,
        nominal,
        attachmentUrl,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Transaksi tersimpan.");
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
          <Button className="shadow-[0_8px_18px_rgba(172,94,113,0.26)]">
            <Plus className="size-4" />
            Transaksi Baru
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Catat Transaksi</DialogTitle>
          <DialogDescription>Entri baru akan langsung memperbarui saldo dan laporan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tx-date">Tanggal</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tx-category">Kategori</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger id="tx-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-division">Divisi</Label>
            <Select value={division} onValueChange={(value) => value && setDivision(value)}>
              <SelectTrigger id="tx-division" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {divisionOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-desc">Keterangan</Label>
            <Input
              id="tx-desc"
              placeholder="mis. Pembelian 9 Galon Aqua"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 rounded-2xl bg-muted p-1 sm:col-span-2">
            {(["masuk", "keluar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
                  type === t
                    ? "bg-card text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "masuk" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="tx-nominal">
              {type === "masuk" ? "Nominal pemasukan" : "Nominal pengeluaran"}
            </Label>
            <div className="flex items-center gap-2 rounded-[13px] border border-input bg-card px-3.5 py-1">
              <span className="text-sm text-muted-foreground">Rp</span>
              <input
                id="tx-nominal"
                inputMode="numeric"
                placeholder="0"
                value={nominalDisplay}
                onChange={(e) => setNominalDisplay(formatNominal(e.target.value))}
                className="w-full bg-transparent py-1.5 font-variant-tabular text-base outline-none"
              />
            </div>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Lampiran foto struk (opsional)</Label>
            <PhotoUpload value={attachmentUrl} onChange={setAttachmentUrl} />
            <p className="text-xs text-muted-foreground">
              Foto disimpan langsung bersama data transaksi.
            </p>
          </div>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Saldo setelah entri ini: <span className="font-medium text-foreground">{rp(preview)}</span>
          </p>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
