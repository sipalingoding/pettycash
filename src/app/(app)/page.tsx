import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { PrintReportDialog } from "@/components/print-report-dialog";
import { YearFilter } from "@/components/year-filter";
import { StatCard } from "@/components/stat-card";
import { MonthlyCashflowChart } from "@/components/charts/monthly-cashflow-chart";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { Card } from "@/components/ui/card";
import {
  getAggregates,
  getAvailableYears,
  getCategoryNames,
  getCurrentBalance,
  getDivisionNames,
} from "@/db/queries";
import { rp, fmtCount, tglPanjang, monthShort } from "@/lib/format";

export default async function DashboardPage({
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
  const avgMonthly = agg.months.length ? agg.totalOut / agg.months.length : 0;
  const periodLabel = agg.months.length
    ? `${monthShort(agg.months[0].month)}–${monthShort(agg.months[agg.months.length - 1].month)} ${agg.months[0].month.slice(0, 4)}`
    : "";

  return (
    <>
      <PageHeader kicker="Ringkasan Keuangan" title="Halo, selamat datang kembali">
        <YearFilter years={years} />
        <PrintReportDialog />
        <AddTransactionDialog
          currentBalance={currentBalance}
          categoryOptions={categoryOptions}
          divisionOptions={divisionOptions}
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Saldo Akhir"
          value={rp(agg.currentBalance)}
          foot={agg.lastDate ? `per ${tglPanjang(agg.lastDate)}` : "—"}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Pemasukan"
          value={rp(agg.totalIn)}
          foot={periodLabel}
          tone="income"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Pengeluaran"
          value={rp(agg.totalOut)}
          foot={`${fmtCount(agg.outCount)} pengeluaran`}
          tone="expense"
        />
        <StatCard
          icon={Target}
          label="Rata-rata / bulan"
          value={rp(avgMonthly)}
          foot={`pengeluaran, ${agg.months.length} bulan`}
          highlight
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card className="gap-0 rounded-[22px] border-border p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">Arus Kas Bulanan</h2>
            <div className="flex gap-3.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="size-2.5 rounded-[3px]" style={{ background: "var(--color-income)" }} />
                Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2.5 rounded-[3px]" style={{ background: "var(--color-primary)" }} />
                Pengeluaran
              </span>
            </div>
          </div>
          <MonthlyCashflowChart months={agg.months} />
        </Card>

        <Card className="gap-0 rounded-[22px] border-border p-6">
          <h2 className="font-heading mb-5 text-lg font-semibold">Pengeluaran per Kategori</h2>
          <CategoryDonutChart categories={agg.categories} totalCategoryCount={agg.categories.length} />
        </Card>
      </div>
    </>
  );
}
