"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { importTransactionsAction, type ImportResult } from "@/lib/actions";
import { fmtCount } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "append" | "replace";

export function ImportTransactionsDialog() {
  const [open, setOpen] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>("append");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMode("append");
    setFileName(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function runImport() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file .xlsx terlebih dahulu.");
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const res = await importTransactionsAction(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
      toast.success(`${fmtCount(res.imported)} transaksi berhasil diimpor.`);
    });
  }

  function handleSubmit() {
    if (mode === "replace") {
      setConfirmReplace(true);
      return;
    }
    runImport();
  }

  return (
    <>
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
              <Upload className="size-4" />
              Import Excel
            </Button>
          }
        />
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Import Transaksi</DialogTitle>
            <DialogDescription>
              Unggah file Excel (.xlsx) dengan kolom Tanggal, Keterangan, Pemasukan, Pengeluaran,
              Kategori, dan Divisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>File Excel</Label>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  setFileName(e.target.files?.[0]?.name ?? null);
                  setResult(null);
                  setError(null);
                }}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2.5 rounded-[13px] border border-dashed border-input bg-card px-3.5 py-3 text-left text-sm hover:border-ring/60"
              >
                <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
                <span className={cn("truncate", !fileName && "text-muted-foreground")}>
                  {fileName ?? "Pilih file .xlsx…"}
                </span>
              </button>
            </div>

            <div className="grid gap-1.5">
              <Label>Mode import</Label>
              <div className="flex gap-1.5 rounded-2xl bg-muted p-1">
                {(
                  [
                    { key: "append" as const, label: "Tambah ke data yang ada" },
                    { key: "replace" as const, label: "Ganti semua data" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMode(opt.key)}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors",
                      mode === opt.key
                        ? "bg-card text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {mode === "replace" && (
                <p className="flex items-start gap-1.5 text-xs text-destructive">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  Semua transaksi yang ada saat ini akan dihapus permanen sebelum data baru
                  dimasukkan.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {result?.ok && (
              <div className="rounded-2xl bg-income/10 p-3.5 text-sm">
                <div className="flex items-center gap-1.5 font-medium text-income-foreground">
                  <CheckCircle2 className="size-4" />
                  {fmtCount(result.imported)} transaksi diimpor
                  {result.skipped > 0 && `, ${fmtCount(result.skipped)} baris dilewati`}.
                </div>
                {(result.newCategories.length > 0 || result.newDivisions.length > 0) && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {result.newCategories.length > 0 &&
                      `Kategori baru: ${result.newCategories.join(", ")}. `}
                    {result.newDivisions.length > 0 &&
                      `Divisi baru: ${result.newDivisions.join(", ")}.`}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Mengimpor…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti semua data transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua transaksi yang ada saat ini akan dihapus permanen dan digantikan isi file yang
              diunggah. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmReplace(false);
                runImport();
              }}
            >
              Ganti Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
