"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Recharts foundation.
 *
 * Recharts is browser-only, so every chart lives in a `"use client"` module and
 * receives plain, serialisable data from a Server Component. The shared
 * `ChartContainer` fixes the height, the axis styling and the tooltip so every
 * chart in the app looks like it came from the same system.
 */

const AXIS_STYLE = {
  fontSize: 12,
  fill: "var(--color-muted-foreground)",
} as const;

const GRID_STYLE = {
  stroke: "var(--color-border)",
  strokeDasharray: "3 3",
} as const;

/** Lightweight tooltip styled to match the rest of the UI. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-sm">
      {label !== undefined ? (
        <p className="mb-1 font-medium">{label}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartFrame({
  height = 260,
  children,
}: {
  height?: number;
  children: React.ReactElement;
}) {
  return (
    // Recharts needs a non-zero width; the wrapper keeps it responsive.
    <div style={{ width: "100%", height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function TrendAreaChart<T extends object>({
  data,
  dataKey = "value",
  name = "Issues",
  color = "var(--color-chart-1)",
  height = 260,
}: {
  data: readonly T[];
  dataKey?: string;
  name?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <AreaChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey="label" {...AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ChartFrame>
  );
}

export function StackedAreaChart<T extends object>({
  data,
  series,
  height = 260,
}: {
  data: readonly T[];
  series: readonly { dataKey: string; name: string; color: string }[];
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <AreaChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey="label" {...AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
        />
        {series.map((item) => (
          <Area
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stackId="1"
            stroke={item.color}
            fill={item.color}
            fillOpacity={0.16}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ChartFrame>
  );
}

export function CategoryBarChart<T extends object>({
  data,
  height = 280,
  horizontal = true,
  color = "var(--color-chart-1)",
}: {
  data: readonly T[];
  height?: number;
  horizontal?: boolean;
  color?: string;
}) {
  return (
    <ChartFrame height={height}>
      <BarChart
        data={[...data]}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={
          horizontal
            ? { top: 4, right: 16, bottom: 0, left: 8 }
            : { top: 8, right: 8, bottom: 0, left: -18 }
        }
        barCategoryGap={horizontal ? "22%" : "18%"}
      >
        <CartesianGrid {...GRID_STYLE} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              {...AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={124}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="label" {...AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar
          dataKey="value"
          name="Issues"
          fill={color}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}

export function StatusLineChart<T extends object>({
  data,
  height = 240,
  color = "var(--color-chart-2)",
}: {
  data: readonly T[];
  height?: number;
  color?: string;
}) {
  return (
    <ChartFrame height={height}>
      <LineChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis dataKey="label" {...AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
        <Line
          type="monotone"
          dataKey="value"
          name="Issues"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3.5 }}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function DonutChart<T extends { label: string }>({
  data,
  height = 220,
}: {
  data: readonly T[];
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <PieChart>
        <Tooltip content={<ChartTooltip />} />
        <Pie
          data={[...data]}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="86%"
          paddingAngle={2}
          stroke="var(--color-card)"
          strokeWidth={2}
        >
          {data.map((item, index) => (
            <Cell
              key={item.label}
              fill={`var(--color-chart-${(index % 5) + 1})`}
            />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
        />
      </PieChart>
    </ChartFrame>
  );
}
