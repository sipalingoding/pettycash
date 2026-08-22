"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_YEARS = "Semua";

export function YearFilter({ years }: { years: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (years.length === 0) return null;

  const activeYear = searchParams.get("year") ?? ALL_YEARS;

  function handleChange(value: string | null) {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    if (value === ALL_YEARS) next.delete("year");
    else next.set("year", value);
    next.delete("page"); // filter change resets pagination on pages that have it
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <Select value={activeYear} onValueChange={handleChange}>
      <SelectTrigger className="w-fit">
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : (
          <CalendarRange className="size-3.5 text-muted-foreground" />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_YEARS}>Semua Tahun</SelectItem>
        {years.map((y) => (
          <SelectItem key={y} value={y}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
