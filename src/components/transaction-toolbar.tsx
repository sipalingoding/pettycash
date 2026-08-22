"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildQuery(current: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  next.delete("page"); // any filter change resets pagination
  return next.toString();
}

export function TransactionToolbar({ categoryChips }: { categoryChips: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = searchParams.get("cat") ?? "Semua";
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync when the URL's ?q= changes from outside this input (chip click,
  // browser back/forward) — adjusted during render, not in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setSearch(urlQuery);
  }

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

  const exportHref = `/api/export?${buildQuery(searchParams, {})}`;

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4">
      <div className="flex flex-wrap gap-2">
        {["Semua", ...categoryChips, "Lainnya"].map((chip) => (
          <button
            key={chip}
            onClick={() => navigate({ cat: chip === "Semua" ? null : chip })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors",
              activeCategory === chip
                ? "border-ring bg-secondary text-secondary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-ring/60"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="relative ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari keterangan…"
            className="w-[220px] rounded-[14px] pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={exportHref} download>
              <Download className="size-3.5" />
              CSV
            </a>
          }
        />
      </div>
    </div>
  );
}
