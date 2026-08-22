"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tgl } from "@/lib/format";

const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_LABELS = ["M", "S", "S", "R", "K", "J", "S"];

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso: string | null | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

type Cell = { y: number; m: number; d: number; outside: boolean };

function buildMonthGrid(viewYear: number, viewMonth: number): Cell[] {
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Cell[] = [];
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ y: prevYear, m: prevMonth, d: daysInPrevMonth - startWeekday + 1 + i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y: viewYear, m: viewMonth, d, outside: false });
  }
  let cursor = cells[cells.length - 1];
  while (cells.length < 42) {
    const next = new Date(cursor.y, cursor.m, cursor.d + 1);
    cursor = { y: next.getFullYear(), m: next.getMonth(), d: next.getDate(), outside: true };
    cells.push(cursor);
  }
  return cells;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  min,
  max,
  className,
}: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}) {
  const selected = parseIso(value);
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.m ?? today.getMonth());

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setViewYear(selected?.y ?? today.getFullYear());
      setViewMonth(selected?.m ?? today.getMonth());
    }
  }

  function goMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function isDisabled(iso: string) {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  const yearOptions = Array.from({ length: 13 }, (_, i) => viewYear - 6 + i);
  const cells = buildMonthGrid(viewYear, viewMonth);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              className
            )}
          />
        }
      >
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? tgl(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[264px]">
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1 text-[13px] font-medium">
            <span>{MONTHS_LONG[viewMonth]}</span>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="rounded-md bg-transparent px-1 py-0.5 text-[13px] outline-none hover:bg-secondary"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-[11px] text-muted-foreground">
          {DAY_LABELS.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[13px]">
          {cells.map((c, i) => {
            const iso = toIso(c.y, c.m, c.d);
            const disabled = isDisabled(iso);
            const isSelected = value === iso;
            const isToday = iso === todayIso;
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
                className={cn(
                  "mx-auto flex size-8 items-center justify-center rounded-full transition-colors",
                  c.outside && "text-muted-foreground/40",
                  !c.outside && !isSelected && "text-foreground hover:bg-secondary",
                  isSelected && "bg-primary font-medium text-primary-foreground",
                  !isSelected && isToday && "ring-1 ring-ring",
                  disabled && "pointer-events-none opacity-30"
                )}
              >
                {c.d}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
