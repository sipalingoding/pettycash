"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadFile } from "@/lib/download-file";

function buildExportHref(
  current: URLSearchParams,
  manual?: { from: string; to: string; txFrom: string; txTo: string },
) {
  const params = new URLSearchParams(current);
  params.delete("page");
  if (manual) {
    if (manual.from) params.set("from", manual.from);
    else params.delete("from");
    if (manual.to) params.set("to", manual.to);
    else params.delete("to");
    if (manual.txFrom) params.set("txFrom", manual.txFrom);
    else params.delete("txFrom");
    if (manual.txTo) params.set("txTo", manual.txTo);
    else params.delete("txTo");
  }
  const qs = params.toString();
  return qs ? `/api/export?${qs}` : "/api/export";
}

function hasTransactionFilter(searchParams: URLSearchParams) {
  const type = searchParams.get("type");
  return (
    !!searchParams.get("q") ||
    !!searchParams.get("from") ||
    !!searchParams.get("to") ||
    !!searchParams.get("txFrom") ||
    !!searchParams.get("txTo") ||
    (searchParams.get("cat") ?? "Semua") !== "Semua" ||
    (searchParams.get("div") ?? "Semua") !== "Semua" ||
    (searchParams.get("year") ?? "Semua") !== "Semua" ||
    type === "masuk" ||
    type === "keluar"
  );
}

export function ExportTransactionsDialog() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");

  const filtered = hasTransactionFilter(searchParams);
  const invalidRange = !!from && !!to && from > to;
  const invalidTxRange = !!txFrom && !!txTo && Number(txFrom) > Number(txTo);
  const canDownload = !invalidRange && !invalidTxRange;
  const href = filtered
    ? buildExportHref(searchParams)
    : buildExportHref(searchParams, { from, to, txFrom, txTo });

  function reset() {
    setFrom("");
    setTo("");
    setTxFrom("");
    setTxTo("");
  }

  function handleDownload() {
    if (!canDownload) return;
    startTransition(async () => {
      try {
        await downloadFile(href, "petty-cash.csv");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengunduh CSV.");
      }
    });
  }

  if (filtered) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={pending}
        title="Unduh CSV sesuai filter aktif"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        {pending ? "Menyiapkan…" : "CSV"}
      </Button>
    );
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
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            CSV
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Ekspor Transaksi</DialogTitle>
          <DialogDescription>
            Kosongkan tanggal dan nomor transaksi untuk mengekspor semua data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Dari tanggal</Label>
            <DatePicker value={from} onChange={setFrom} max={to || undefined} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sampai tanggal</Label>
            <DatePicker value={to} onChange={setTo} min={from || undefined} />
          </div>
          {invalidRange && (
            <p className="col-span-2 text-sm text-destructive">
              &ldquo;Dari tanggal&rdquo; tidak boleh setelah &ldquo;sampai tanggal&rdquo;.
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="export-tx-from">No transaksi dari</Label>
            <Input
              id="export-tx-from"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="mis. 1"
              value={txFrom}
              onChange={(e) => setTxFrom(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="export-tx-to">No transaksi sampai</Label>
            <Input
              id="export-tx-to"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="mis. 50"
              value={txTo}
              onChange={(e) => setTxTo(e.target.value)}
            />
          </div>
          {invalidTxRange && (
            <p className="col-span-2 text-sm text-destructive">
              &ldquo;No transaksi dari&rdquo; tidak boleh lebih besar dari &ldquo;sampai&rdquo;.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={!canDownload || pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {pending ? "Menyiapkan…" : "Unduh CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
