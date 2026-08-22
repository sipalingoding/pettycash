"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { monthShort } from "@/lib/format";
import type { MonthStat } from "@/db/queries";

const chartConfig = {
  amountIn: { label: "Pemasukan", color: "var(--color-income)" },
  amountOut: { label: "Pengeluaran", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function MonthlyCashflowChart({ months }: { months: MonthStat[] }) {
  const data = months.map((m) => ({
    month: monthShort(m.month),
    amountIn: m.amountIn,
    amountOut: m.amountOut,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} barGap={6}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          fontSize={12}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                ` Rp ${Number(value).toLocaleString("id-ID")}`,
                name === "amountIn" ? "Pemasukan" : "Pengeluaran",
              ]}
            />
          }
        />
        <Bar dataKey="amountIn" fill="var(--color-amountIn)" radius={[6, 6, 2, 2]} />
        <Bar dataKey="amountOut" fill="var(--color-amountOut)" radius={[6, 6, 2, 2]} />
      </BarChart>
    </ChartContainer>
  );
}
