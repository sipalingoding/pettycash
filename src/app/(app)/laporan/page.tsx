import { PageHeader } from "@/components/page-header";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { YearFilter } from "@/components/year-filter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAggregates,
  getAvailableYears,
  getCategoryNames,
  getCurrentBalance,
  getDivisionNames,
} from "@/db/queries";
import { rp, signedRp, fmtCount, monthLong } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const year = typeof sp.year === "string" ? sp.year : "Semua";

  const [agg, categoryOptions, divisionOptions, years, currentBalance] = await Promise.all([
    getAggregates(year),
    getCategoryNames(),
    getDivisionNames(),
    getAvailableYears(),
    getCurrentBalance(),
  ]);
  const totalSelisih = agg.totalIn - agg.totalOut;
  const periodLabel = agg.months.length
    ? `${monthLong(agg.months[0].month).split(" ")[0]}–${monthLong(agg.months[agg.months.length - 1].month)}`
    : "";

  return (
    <>
      <PageHeader kicker="Rekapitulasi" title="Laporan Bulanan">
        <YearFilter years={years} />
        <AddTransactionDialog
          currentBalance={currentBalance}
          categoryOptions={categoryOptions}
          divisionOptions={divisionOptions}
        />
      </PageHeader>

      <Card className="gap-0 rounded-[22px] border-border p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Rekap Bulanan</h2>
          <span className="text-[12.5px] text-muted-foreground">{periodLabel}</span>
        </div>

        <div className="overflow-x-auto">
          <Table className="font-variant-tabular min-w-[560px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Bulan</TableHead>
                <TableHead className="text-right">Pemasukan</TableHead>
                <TableHead className="text-right">Pengeluaran</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead className="text-right">Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agg.months.map((m) => {
                const selisih = m.amountIn - m.amountOut;
                return (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{monthLongName(m.month)}</TableCell>
                    <TableCell className="text-income-foreground text-right">{rp(m.amountIn)}</TableCell>
                    <TableCell className="text-expense-foreground text-right">{rp(m.amountOut)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[12.5px]",
                          selisih < 0 ? "bg-expense/15 text-expense-foreground" : "bg-income/15 text-income-foreground"
                        )}
                      >
                        {signedRp(selisih)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtCount(m.count)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableCell className="font-heading text-base font-semibold">Total</TableCell>
                <TableCell className="text-income-foreground text-right font-medium">{rp(agg.totalIn)}</TableCell>
                <TableCell className="text-expense-foreground text-right font-medium">{rp(agg.totalOut)}</TableCell>
                <TableCell className="text-right font-medium">{signedRp(totalSelisih)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmtCount(agg.count)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}

function monthLongName(ym: string) {
  return monthLong(ym).split(" ")[0];
}
