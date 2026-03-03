"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig } from "@/lib/utils/chart-utils";

interface BarChartViewProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-subtle rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export function BarChartView({ data, config }: BarChartViewProps) {
  const chartData = data.map((row) => ({
    ...row,
    [config.valueKey]: Number(row[config.valueKey]) || 0,
  }));

  return (
    <div
      aria-label={`Bar chart showing ${config.valueLabel} by ${config.categoryKey}`}
      role="img"
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(1 0 0 / 0.06)"
            vertical={false}
          />
          <XAxis
            dataKey={config.categoryKey}
            tick={{ fontSize: 10, fill: "oklch(0.58 0.01 270)" }}
            axisLine={{ stroke: "oklch(1 0 0 / 0.08)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "oklch(0.58 0.01 270)" }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
          <Bar
            dataKey={config.valueKey}
            fill="var(--data-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
