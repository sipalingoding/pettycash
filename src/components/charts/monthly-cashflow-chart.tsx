"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";
import type { BarShapeProps } from "recharts";
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

// Lifts the hovered bar off the baseline with a soft shadow underneath it, so the
// reader sees the bar itself "pop" instead of relying only on the tooltip.
const LIFT = 6;
function ActiveBar({ x, y, width, height, fill, radius }: BarShapeProps) {
  return (
    <g style={{ filter: "brightness(1.05) drop-shadow(0 8px 10px rgba(0,0,0,0.22))" }}>
      <Rectangle
        x={x as number}
        y={(y as number) - LIFT}
        width={width}
        height={height}
        fill={fill}
        radius={radius}
      />
    </g>
  );
}

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
        <Bar dataKey="amountIn" fill="var(--color-amountIn)" radius={[6, 6, 2, 2]} activeBar={ActiveBar} />
        <Bar dataKey="amountOut" fill="var(--color-amountOut)" radius={[6, 6, 2, 2]} activeBar={ActiveBar} />
      </BarChart>
    </ChartContainer>
  );
}
