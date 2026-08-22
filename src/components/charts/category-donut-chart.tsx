"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { categoryColor, UNCATEGORIZED } from "@/lib/categories";
import { rp } from "@/lib/format";
import type { CategoryStat } from "@/db/queries";

// Pops the hovered slice outward with a soft shadow, so the ring itself responds —
// the center readout (below) swaps to that slice's data at the same time.
function ActiveSlice({
  isActive,
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  cornerRadius,
  fill,
  stroke,
  strokeWidth,
}: PieSectorShapeProps) {
  return (
    <g style={isActive ? { filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.28))" } : undefined}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={isActive ? (outerRadius as number) + 6 : outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

export function CategoryDonutChart({
  categories,
  totalCategoryCount,
}: {
  categories: CategoryStat[];
  totalCategoryCount: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const top = categories.slice(0, 6);
  const rest = categories.slice(6).reduce((sum, c) => sum + c.amountOut, 0);
  const entries = top.map((c) => ({ name: c.category, value: c.amountOut, isRest: false }));
  if (rest > 0) entries.push({ name: "Lainnya", value: rest, isRest: true });
  const total = entries.reduce((s, e) => s + e.value, 0) || 1;

  const chartConfig = Object.fromEntries(
    entries.map((e) => [e.name, { label: e.name }])
  ) satisfies ChartConfig;

  const active = hovered !== null ? entries[hovered] : null;
  const activePct = active ? ((active.value / total) * 100).toFixed(1).replace(".", ",") : null;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-[220px] shrink-0">
        <ChartContainer config={chartConfig} className="aspect-square size-[220px]">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={106}
              strokeWidth={2}
              stroke="var(--card)"
              shape={ActiveSlice}
              onMouseEnter={(_, index) => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {active ? (
            <>
              <div className="font-heading text-lg leading-snug font-semibold text-balance">
                {rp(active.value)}
              </div>
              <div className="mt-1 max-w-full truncate text-xs tracking-wide text-muted-foreground uppercase">
                {active.name} &middot; {activePct}%
              </div>
            </>
          ) : (
            <>
              <div className="font-heading text-3xl font-semibold">{totalCategoryCount}</div>
              <div className="text-xs tracking-wide text-muted-foreground uppercase">Kategori</div>
            </>
          )}
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
