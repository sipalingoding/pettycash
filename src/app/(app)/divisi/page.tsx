import { PageHeader } from "@/components/page-header";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { AddDivisionDialog } from "@/components/add-division-dialog";
import { EditDivisionDialog } from "@/components/edit-division-dialog";
import { DeleteDivisionButton } from "@/components/delete-division-dialog";
import { Card } from "@/components/ui/card";
import { getAggregates, getCategoryNames, getDivisionStats } from "@/db/queries";
import { divisionColor, UNASSIGNED_DIVISION } from "@/lib/divisions";
import { fmtCount } from "@/lib/format";

export default async function DivisiPage() {
  const [agg, categoryOptions, stats] = await Promise.all([
    getAggregates(),
    getCategoryNames(),
    getDivisionStats(),
  ]);
  const divisionOptions = stats.map((d) => d.name);
  const named = stats.filter((d) => d.name !== UNASSIGNED_DIVISION);

  return (
    <>
      <PageHeader kicker="Pengaturan" title="Divisi">
        <AddDivisionDialog />
        <AddTransactionDialog
          currentBalance={agg.currentBalance}
          categoryOptions={categoryOptions}
          divisionOptions={divisionOptions}
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {named.length === 0 && (
          <Card className="col-span-full rounded-2xl border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada divisi. Tambahkan lewat tombol &ldquo;Tambah Divisi&rdquo; di atas.
          </Card>
        )}
        {named.map((d) => {
          const color = divisionColor(d.name);
          return (
            <Card key={d.id} className="group gap-0 rounded-2xl border-border p-5">
              <div className="flex items-center gap-2.5">
                <span className="size-3 shrink-0 rounded-[5px]" style={{ background: color }} />
                <div className="min-w-0 flex-1 truncate text-sm font-medium" title={d.name}>
                  {d.name}
                </div>
                <EditDivisionDialog id={d.id} currentName={d.name} />
                <DeleteDivisionButton name={d.name} count={d.count} />
              </div>
              <div className="mt-3.5 text-xs text-muted-foreground">{fmtCount(d.count)} transaksi</div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
