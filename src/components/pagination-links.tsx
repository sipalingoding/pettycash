import Link from "next/link";
import { cn } from "@/lib/utils";

function hrefForPage(base: Record<string, string>, page: number) {
  const params = new URLSearchParams(base);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/transaksi?${qs}` : "/transaksi";
}

export function PaginationLinks({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: Record<string, string>;
}) {
  const windowSize = 5;
  let lo = Math.max(1, page - Math.floor(windowSize / 2));
  const hi = Math.min(totalPages, lo + windowSize - 1);
  lo = Math.max(1, hi - windowSize + 1);
  const pages = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

  const pageBtn = (p: number, disabled: boolean, label: string | number, active = false) =>
    disabled ? (
      <span
        key={label}
        className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-1.5 text-muted-foreground/40"
      >
        {label}
      </span>
    ) : (
      <Link
        key={label}
        href={hrefForPage(baseParams, p)}
        className={cn(
          "flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 font-variant-tabular text-sm",
          active
            ? "border-ring bg-secondary font-semibold text-secondary-foreground"
            : "border-border text-muted-foreground hover:border-ring/60"
        )}
      >
        {label}
      </Link>
    );

  return (
    <div className="flex items-center gap-1.5 print:hidden">
      {pageBtn(page - 1, page <= 1, "‹")}
      {pages.map((p) => pageBtn(p, false, p, p === page))}
      {pageBtn(page + 1, page >= totalPages, "›")}
    </div>
  );
}
