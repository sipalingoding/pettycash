"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
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
import { REPORT_CONFIG } from "@/lib/report-config";
import { formatNominalInput } from "@/lib/format";
import { cn } from "@/lib/utils";

type Format = "pdf" | "excel";

export function PrintReportDialog() {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [format, setFormat] = useState<Format>("pdf");
  const [targetDisplay, setTargetDisplay] = useState(
    formatNominalInput(String(REPORT_CONFIG.defaultTargetFloat))
  );

  function reset() {
    setFrom("");
    setTo("");
    setTxFrom("");
    setTxTo("");
    setFormat("pdf");
    setDownloading(false);
    setTargetDisplay(formatNominalInput(String(REPORT_CONFIG.defaultTargetFloat)));
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }

  const target = Number(targetDisplay.replace(/[^\d]/g, "")) || 0;
  const invalidRange = !!from && !!to && from > to;
  const invalidTxRange = !!txFrom && !!txTo && Number(txFrom) > Number(txTo);
  const canDownload = !!from && !!to && !invalidRange && !invalidTxRange;

  const params = new URLSearchParams({ from, to, target: String(target) });
  if (txFrom) params.set("txFrom", txFrom);
  if (txTo) params.set("txTo", txTo);
  const href = `/api/print/${format}?${params.toString()}`;

  function handleDownload() {
    if (!canDownload || downloading) return;

    setDownloading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    const link = document.createElement("a");
    link.href = href;
    link.download = `laporan-kas-kecil.${format === "pdf" ? "pdf" : "xlsx"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    loadingTimerRef.current = setTimeout(() => {
      setDownloading(false);
      loadingTimerRef.current = null;
    }, format === "pdf" ? 12_000 : 4_000);
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
            <Printer className="size-4" />
            Cetak Laporan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Cetak Laporan Kas Kecil</DialogTitle>
          <DialogDescription>
            Pilih periode klaim dan format berkas. Laporan mengikuti format resmi PT. Worcas
            Nusantara Abadi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Dari tanggal</Label>
              <DatePicker value={from} onChange={setFrom} max={to || undefined} />
            </div>
            <div className="grid gap-1.5">
              <Label>Sampai tanggal</Label>
              <DatePicker value={to} onChange={setTo} min={from || undefined} />
            </div>
          </div>
          {invalidRange && (
            <p className="text-sm text-destructive">
              &ldquo;Dari tanggal&rdquo; tidak boleh setelah &ldquo;sampai tanggal&rdquo;.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="print-tx-from">No transaksi dari (opsional)</Label>
              <Input
                id="print-tx-from"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="mis. 1"
                value={txFrom}
                onChange={(e) => setTxFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="print-tx-to">No transaksi sampai (opsional)</Label>
              <Input
                id="print-tx-to"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="mis. 50"
                value={txTo}
                onChange={(e) => setTxTo(e.target.value)}
              />
            </div>
          </div>
          {invalidTxRange && (
            <p className="text-sm text-destructive">
              &ldquo;No transaksi dari&rdquo; tidak boleh lebih besar dari &ldquo;sampai&rdquo;.
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="print-target">Target Pettycash</Label>
            <div className="flex items-center gap-2 rounded-[13px] border border-input bg-card px-3.5 py-1">
              <span className="text-sm text-muted-foreground">Rp</span>
              <input
                id="print-target"
                inputMode="numeric"
                placeholder="0"
                value={targetDisplay}
                onChange={(e) => setTargetDisplay(formatNominalInput(e.target.value))}
                className="w-full bg-transparent py-1.5 font-variant-tabular text-base outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dipakai untuk menghitung &ldquo;Pengisian Pettycash&rdquo; (target − saldo akhir periode).
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Format</Label>
            <div className="flex gap-1.5 rounded-2xl bg-muted p-1">
              {(
                [
                  { key: "pdf" as const, label: "PDF", icon: FileText },
                  { key: "excel" as const, label: "Excel", icon: FileSpreadsheet },
                ]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFormat(opt.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium transition-colors",
                    format === opt.key
                      ? "bg-card text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={!canDownload || downloading}>
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
            {downloading ? "Menyiapkan…" : "Unduh Laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
