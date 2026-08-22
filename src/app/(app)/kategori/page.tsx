import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-dialog";
import { Card } from "@/components/ui/card";
import { getAggregates, getCategoryNames, getDivisionNames } from "@/db/queries";
import { categoryColor, UNCATEGORIZED } from "@/lib/categories";
import { rp, fmtCount } from "@/lib/format";

export default async function KategoriPage() {
  const [agg, categoryOptions, divisionOptions] = await Promise.all([
    getAggregates(),
    getCategoryNames(),
    getDivisionNames(),
  ]);
  const uncategorized = agg.categories.find((c) => c.category === UNCATEGORIZED);

  // Every known category gets a card, even ones with no transactions yet —
  // agg.categories only covers categories already used somewhere.
  const statsByCategory = new Map(agg.categories.map((c) => [c.category, c]));
  const named = categoryOptions
    .filter((name) => name !== UNCATEGORIZED)
    .map((name) => statsByCategory.get(name) ?? { category: name, amountOut: 0, amountIn: 0, count: 0 })
    .sort((a, b) => b.amountOut - a.amountOut || a.category.localeCompare(b.category, "id"));
  const maxOut = named.length ? named[0].amountOut || 1 : 1;
  const totalOut = agg.totalOut || 1;

  return (
    <>
      <PageHeader kicker="Pengaturan" title="Kategori Pengeluaran">
        <AddCategoryDialog />
        <AddTransactionDialog
          currentBalance={agg.currentBalance}
          categoryOptions={categoryOptions}
          divisionOptions={divisionOptions}
        />
      </PageHeader>

      {uncategorized && uncategorized.count > 0 && (
        <Card className="mb-4 flex-row flex-wrap items-center gap-4 rounded-2xl border-dashed border-warn-foreground/40 bg-warn p-4.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-warn-foreground">
            <TriangleAlert className="size-4.5" />
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-medium text-warn-foreground">
              {fmtCount(uncategorized.count)} transaksi belum memiliki kategori
            </div>
            <div className="mt-0.5 text-[12.5px] text-warn-foreground/80">
              {rp(uncategorized.amountOut)} pengeluaran &middot; {rp(uncategorized.amountIn)} pemasukan tercatat
              tanpa kategori. Buka detail transaksi untuk melengkapinya.
            </div>
          </div>
          <Link
            href={`/transaksi?cat=${encodeURIComponent(UNCATEGORIZED)}`}
            className="rounded-full border border-warn-foreground/30 bg-card px-3.5 py-1.5 text-[12.5px] text-warn-foreground hover:bg-card/70"
          >
            Lihat di Transaksi
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {named.map((c) => {
          const pct = ((c.amountOut / totalOut) * 100).toFixed(1).replace(".", ",");
          const barPct = Math.max(4, (c.amountOut / maxOut) * 100);
          const color = categoryColor(c.category);
          return (
            <Card key={c.category} className="group gap-0 rounded-2xl border-border p-5">
              <div className="flex items-center gap-2.5">
                <span className="size-3 shrink-0 rounded-[5px]" style={{ background: color }} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium" title={c.category}>
                  {c.category}
                </div>
                <DeleteCategoryButton name={c.category} count={c.count} />
              </div>
              <div className="font-heading mt-3.5 text-xl font-semibold tracking-tight">
                {rp(c.amountOut)}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
              </div>
              <div className="mt-2.5 flex justify-between text-xs text-muted-foreground">
                <span>{fmtCount(c.count)} transaksi</span>
                <span>{pct}%</span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
