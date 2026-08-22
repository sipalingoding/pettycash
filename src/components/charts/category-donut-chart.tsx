"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { categoryColor, UNCATEGORIZED } from "@/lib/categories";
import { rp } from "@/lib/format";
import type { CategoryStat } from "@/db/queries";

export function CategoryDonutChart({
  categories,
  totalCategoryCount,
}: {
  categories: CategoryStat[];
  totalCategoryCount: number;
}) {
  const top = categories.slice(0, 6);
  const rest = categories.slice(6).reduce((sum, c) => sum + c.amountOut, 0);
  const entries = top.map((c) => ({ name: c.category, value: c.amountOut, isRest: false }));
  if (rest > 0) entries.push({ name: "Lainnya", value: rest, isRest: true });
  const total = entries.reduce((s, e) => s + e.value, 0) || 1;

  const chartConfig = Object.fromEntries(
    entries.map((e) => [e.name, { label: e.name }])
  ) satisfies ChartConfig;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-[150px] shrink-0">
        <ChartContainer config={chartConfig} className="aspect-square size-[150px]">
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                const pct = (((p.value as number) / total) * 100).toFixed(1).replace(".", ",");
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                    <div className="font-medium text-popover-foreground">{p.name}</div>
                    <div className="text-muted-foreground">
                      {rp(p.value as number)} &middot; {pct}%
                    </div>
                  </div>
                );
              }}
            />
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={72}
              strokeWidth={2}
              stroke="var(--card)"
            >
              {entries.map((e) => (
                <Cell
                  key={e.name}
                  fill={e.isRest ? "var(--muted-foreground)" : categoryColor(e.name)}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-heading text-lg font-semibold">{totalCategoryCount}</div>
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Kategori</div>
        </div>
      </div>

      <div className="min-w-[180px] flex-1 space-y-2.5">
        {entries.map((e) => {
          const pct = ((e.value / total) * 100).toFixed(1).replace(".", ",");
          const isUncat = e.name === UNCATEGORIZED;
          return (
            <div key={e.name} className="flex items-center gap-2.5 text-[12.5px]">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: e.isRest ? "var(--muted-foreground)" : categoryColor(e.name) }}
              />
              <span className={cnTruncate(isUncat)}>
                {e.name}
                {isUncat && " (perlu kategori)"}
              </span>
              <b className="font-medium text-muted-foreground">{pct}%</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cnTruncate(italic: boolean) {
  return `flex-1 truncate text-muted-foreground ${italic ? "italic" : ""}`;
}
