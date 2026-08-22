import { PageHeader } from "@/components/page-header";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { TransactionToolbar } from "@/components/transaction-toolbar";
import { SortableHeader } from "@/components/sortable-header";
import { TransactionRow } from "@/components/transaction-row";
import { PaginationLinks } from "@/components/pagination-links";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAggregates, getCategoryNames, getDivisionNames, getTransactions } from "@/db/queries";
import { fmtCount } from "@/lib/format";

const PAGE_SIZE = 40;

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "Semua";
  const sort = sp.sort === "amountOut" ? "amountOut" : "date";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const [agg, categoryOptions, divisionOptions] = await Promise.all([
    getAggregates(),
    getCategoryNames(),
    getDivisionNames(),
  ]);
  const topCategories = agg.categories.slice(0, 6).map((c) => c.category);

  const { rows, total } = await getTransactions({
    search: q,
    category: cat,
    topCategories,
    sortBy: sort,
    sortDir: dir,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (cat !== "Semua") baseParams.cat = cat;
  if (sort !== "date") baseParams.sort = sort;
  if (dir !== "desc") baseParams.dir = dir;

  return (
    <>
      <PageHeader kicker="Buku Kas" title="Daftar Transaksi">
        <AddTransactionDialog
          currentBalance={agg.currentBalance}
          categoryOptions={categoryOptions}
          divisionOptions={divisionOptions}
        />
      </PageHeader>

      <Card className="gap-0 overflow-hidden rounded-[22px] border-border py-0">
        <TransactionToolbar categoryChips={topCategories} />

        <div className="overflow-x-auto">
          <Table className="min-w-[1160px]">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-14">No</TableHead>
                <TableHead className="w-24">
                  <SortableHeader field="date" label="Tanggal" />
                </TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-44">Kategori</TableHead>
                <TableHead className="w-36">Divisi</TableHead>
                <TableHead className="w-32 text-right">Pemasukan</TableHead>
                <TableHead className="w-32 text-right">
                  <SortableHeader field="amountOut" label="Pengeluaran" align="right" />
                </TableHead>
                <TableHead className="w-32 text-right">Saldo</TableHead>
                <TableHead className="w-20 text-center">Lampiran</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-14 text-center text-sm text-muted-foreground">
                    Tidak ada transaksi yang cocok dengan pencarian atau filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-[12.5px] text-muted-foreground print:hidden">
          <span>
            {total === 0
              ? "Tidak ada transaksi"
              : `Menampilkan ${fmtCount(start)}–${fmtCount(end)} dari ${fmtCount(total)} transaksi`}
            {total !== agg.count && ` (disaring dari ${fmtCount(agg.count)})`}
          </span>
          <PaginationLinks page={page} totalPages={totalPages} baseParams={baseParams} />
        </div>
      </Card>
    </>
  );
}
