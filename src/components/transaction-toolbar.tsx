"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  CalendarRange,
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  Search,
  Tags,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { ExportTransactionsDialog } from "@/components/export-transactions-dialog";
import { tgl } from "@/lib/format";
import { cn } from "@/lib/utils";

const ALL = "Semua";

function buildQuery(current: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  next.delete("page"); // any filter change resets pagination
  return next.toString();
}

function FilterButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors",
        active
          ? "border-ring bg-secondary text-secondary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-ring/60"
      )}
    >
      <Icon className="size-3.5" />
      <span className="max-w-[140px] truncate">{label}</span>
      <ChevronDown className="size-3 opacity-60" />
    </button>
  );
}

function PickerDialog({
  open,
  onOpenChange,
  title,
  options,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onApply: (value: string) => void;
}) {
  const [selected, setSelected] = useState(value);

  // Resync the pending selection whenever the dialog is (re)opened — adjusted
  // during render, not in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) setSelected(value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="scrollbar-hidden grid max-h-[320px] gap-1 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selected === opt.value
                  ? "bg-secondary text-secondary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {selected === opt.value && <Check className="size-4 shrink-0" />}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(selected);
              onOpenChange(false);
            }}
          >
            Terapkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateRangeDialog({
  open,
  onOpenChange,
  from,
  to,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
}) {
  const [pendingFrom, setPendingFrom] = useState(from);
  const [pendingTo, setPendingTo] = useState(to);

  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setPendingFrom(from);
      setPendingTo(to);
    }
  }

  const invalid = !!pendingFrom && !!pendingTo && pendingFrom > pendingTo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Filter Tanggal</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="grid gap-1.5">
            <Label>Dari tanggal</Label>
            <DatePicker value={pendingFrom} onChange={setPendingFrom} max={pendingTo || undefined} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sampai tanggal</Label>
            <DatePicker value={pendingTo} onChange={setPendingTo} min={pendingFrom || undefined} />
          </div>
          {invalid && (
            <p className="col-span-2 text-sm text-destructive">
              &ldquo;Dari tanggal&rdquo; tidak boleh setelah &ldquo;sampai tanggal&rdquo;.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={invalid}
            onClick={() => {
              onApply(pendingFrom, pendingTo);
              onOpenChange(false);
            }}
          >
            Terapkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionToolbar({
  categoryOptions,
  divisionOptions,
}: {
  categoryOptions: string[];
  divisionOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategory = searchParams.get("cat") ?? ALL;
  const activeDivision = searchParams.get("div") ?? ALL;
  const typeParam = searchParams.get("type");
  const activeType = typeParam === "masuk" || typeParam === "keluar" ? typeParam : null;
  const activeFrom = searchParams.get("from") ?? "";
  const activeTo = searchParams.get("to") ?? "";

  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync when the URL's ?q= changes from outside this input (filter change,
  // browser back/forward) — adjusted during render, not in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setSearch(urlQuery);
  }

  const [catOpen, setCatOpen] = useState(false);
  const [divOpen, setDivOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  function navigate(patch: Record<string, string | null>) {
    const qs = buildQuery(searchParams, patch);
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value || null }), 300);
  }

  const hasActiveFilter = activeCategory !== ALL || activeDivision !== ALL || !!activeType || !!activeFrom || !!activeTo;

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterButton
          icon={Tags}
          label={activeCategory === ALL ? "Kategori" : activeCategory}
          active={activeCategory !== ALL}
          onClick={() => setCatOpen(true)}
        />
        <FilterButton
          icon={Building2}
          label={activeDivision === ALL ? "Divisi" : activeDivision}
          active={activeDivision !== ALL}
          onClick={() => setDivOpen(true)}
        />
        <FilterButton
          icon={ArrowLeftRight}
          label={activeType === "masuk" ? "Pemasukan" : activeType === "keluar" ? "Pengeluaran" : "Jenis"}
          active={!!activeType}
          onClick={() => setTypeOpen(true)}
        />
        <FilterButton
          icon={CalendarRange}
          label={activeFrom || activeTo ? `${activeFrom ? tgl(activeFrom) : "…"} – ${activeTo ? tgl(activeTo) : "…"}` : "Tanggal"}
          active={!!(activeFrom || activeTo)}
          onClick={() => setDateOpen(true)}
        />
        {hasActiveFilter && (
          <button
            onClick={() => navigate({ cat: null, div: null, type: null, from: null, to: null })}
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-destructive"
            title="Hapus semua filter"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="relative ml-auto flex items-center gap-2">
        <div className="relative">
          {isPending ? (
            <Loader2 className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari keterangan…"
            className="w-[220px] rounded-[14px] pl-8"
          />
        </div>
        <ExportTransactionsDialog />
      </div>

      <PickerDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        title="Filter Kategori"
        value={activeCategory}
        options={[{ value: ALL, label: "Semua kategori" }, ...categoryOptions.map((c) => ({ value: c, label: c }))]}
        onApply={(value) => navigate({ cat: value === ALL ? null : value })}
      />

      <PickerDialog
        open={divOpen}
        onOpenChange={setDivOpen}
        title="Filter Divisi"
        value={activeDivision}
        options={[{ value: ALL, label: "Semua divisi" }, ...divisionOptions.map((d) => ({ value: d, label: d }))]}
        onApply={(value) => navigate({ div: value === ALL ? null : value })}
      />

      <PickerDialog
        open={typeOpen}
        onOpenChange={setTypeOpen}
        title="Filter Jenis"
        value={activeType ?? ALL}
        options={[
          { value: ALL, label: "Semua jenis" },
          { value: "masuk", label: "Pemasukan" },
          { value: "keluar", label: "Pengeluaran" },
        ]}
        onApply={(value) => navigate({ type: value === ALL ? null : value })}
      />

      <DateRangeDialog
        open={dateOpen}
        onOpenChange={setDateOpen}
        from={activeFrom}
        to={activeTo}
        onApply={(from, to) => navigate({ from: from || null, to: to || null })}
      />
    </div>
  );
}
