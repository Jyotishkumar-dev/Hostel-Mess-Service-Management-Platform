"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsData, AnalyticsFilters } from "@/lib/admin/analytics";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#f97316", "#06b6d4"];

const AXIS_STYLE = { fontSize: 12, fill: "var(--color-muted-foreground)" };
const GRID_STYLE = { stroke: "var(--color-border)", strokeDasharray: "3 3" };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-sm">
      {label !== undefined ? <p className="mb-1 font-medium">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((item, idx: number) => (
          <li key={idx} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }} />
            <span className="text-muted-foreground">{item.name || label}</span>
            <span className="ml-auto font-medium tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Skeleton() {
  return <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted/40" />;
}

export function AnalyticsClient({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [filters, setFilters] = useState<AnalyticsFilters>({ dateRange: "30d", service: "all" });
  const [loading, setLoading] = useState(false);

  async function refresh(newFilters: AnalyticsFilters) {
    setFilters(newFilters);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("dateRange", newFilters.dateRange);
      params.set("service", newFilters.service);
      if (newFilters.startDate) params.set("startDate", newFilters.startDate);
      if (newFilters.endDate) params.set("endDate", newFilters.endDate);
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["Date", "Service", "Category", "Location", "Priority", "Status", "Resolution Hours", "Verification", "Rating"].join(","),
    ];
    for (const sp of data.servicePerformance) {
      rows.push([new Date().toISOString(), sp.service, sp.category, "", "", "", sp.avgResolutionHours ?? "", "", sp.avgRating ?? ""].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const stats = data.stats;
  const statCards = [
    { label: "Total Complaints", value: stats.totalComplaints, hint: data.dateRangeLabel },
    { label: "Open Issues", value: stats.openIssues, hint: "Not resolved/verified" },
    { label: "Resolved", value: stats.resolved, hint: "Marked resolved" },
    { label: "Verified", value: stats.verified, hint: "Confirmed by students" },
    { label: "Reopened", value: stats.reopened, hint: "Student rejected fix" },
    { label: "Avg Resolution Time", value: stats.averageResolutionHours ?? "—", hint: stats.averageResolutionHours !== null ? "Hours (reported → resolved)" : "Insufficient data", suffix: stats.averageResolutionHours !== null ? " hrs" : "" },
    { label: "Reopen Rate", value: stats.reopenRate ?? "—", hint: "Resolved/Verified that were reopened", suffix: stats.reopenRate !== null ? "%" : "" },
    { label: "Avg Rating", value: stats.averageRating ?? "—", hint: stats.ratingCount > 0 ? `${stats.ratingCount} ratings` : "No feedback yet", suffix: stats.averageRating !== null ? "/5" : "" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Download}
        title="Service analytics"
        description="Where campus services improve, and where the same problems keep coming back."
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.dateRange}
          onChange={(e) => refresh({ ...filters, dateRange: e.target.value as AnalyticsFilters["dateRange"] })}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="semester">This semester</option>
          <option value="custom">Custom</option>
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.service}
          onChange={(e) => refresh({ ...filters, service: e.target.value as AnalyticsFilters["service"] })}
        >
          <option value="all">All</option>
          <option value="hostel">Hostel</option>
          <option value="mess">Mess</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => refresh(filters)} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-2xl font-semibold">{s.value}</p>
              {s.suffix && <span className="text-sm text-muted-foreground">{s.suffix}</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Issues over time" description="Daily volume reported.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" style={GRID_STYLE} />
                <XAxis dataKey="label" style={AXIS_STYLE} />
                <YAxis allowDecimals={false} style={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorIssues)" name="Issues" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Hostel vs mess" description="Where pressure is coming from.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.hostelVsMess}>
                <CartesianGrid strokeDasharray="3 3" style={GRID_STYLE} />
                <XAxis dataKey="label" style={AXIS_STYLE} />
                <YAxis allowDecimals={false} style={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="hostel" name="Hostel" fill="#2563eb" />
                <Bar dataKey="mess" name="Mess" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top complaint categories" description="Most reported problems.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.byCategory.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" style={GRID_STYLE} />
                <XAxis type="number" allowDecimals={false} style={AXIS_STYLE} />
                <YAxis type="category" dataKey="label" width={150} style={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Complaints" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Location analysis" description="Complaints by hostel block/location.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.byLocation}>
                <CartesianGrid strokeDasharray="3 3" style={GRID_STYLE} />
                <XAxis dataKey="label" style={AXIS_STYLE} />
                <YAxis allowDecimals={false} style={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Complaints" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Priority distribution" description="Severity breakdown.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.byPriority} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                  {data.byPriority.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Resolution outcome" description="Verified vs Reopened vs Awaiting Verification.">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Verified", value: data.resolutionOutcome.verified },
                    { name: "Reopened", value: data.resolutionOutcome.reopened },
                    { name: "Awaiting Verification", value: data.resolutionOutcome.awaitingVerification },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Resolution time over time" description="Average resolution time trend (hours).">
        {loading ? <Skeleton /> : (
          data.resolutionTimeOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not enough resolution data to calculate average resolution time.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.resolutionTimeOverTime}>
                <CartesianGrid strokeDasharray="3 3" style={GRID_STYLE} />
                <XAxis dataKey="label" style={AXIS_STYLE} />
                <YAxis style={AXIS_STYLE} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="avgHours" name="Avg Hours" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">Recurring problems</h3>
          <p className="mt-1 text-xs text-muted-foreground">Repeated service/category/location combinations.</p>
          {data.recurring.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No recurring patterns found for this period.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {data.recurring.map((r, idx) => (
                <div key={r.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.area} • {r.lastReported}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{r.reports}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">Service health overview</h3>
          <p className="mt-1 text-xs text-muted-foreground">Based on volume, resolution time, reopen rate, satisfaction.</p>
          {data.serviceHealth.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Not enough data yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {data.serviceHealth.slice(0, 8).map((h) => (
                <div key={h.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{h.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.complaints} complaints • Reopen: {h.reopenRate !== null ? `${h.reopenRate}%` : "—"} • Avg: {h.avgResolutionHours !== null ? `${h.avgResolutionHours}h` : "—"}
                    </p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-1 ${h.status === "good" ? "bg-green-100 text-green-700" : h.status === "watch" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {h.status === "good" ? "Good" : h.status === "watch" ? "Watch" : "Needs Attention"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">AI Processing Metrics</h3>
        <p className="mt-1 text-xs text-muted-foreground">Duplicate detection & processing status.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Analyses</p>
            <p className="mt-1 text-lg font-semibold">{data.aiMetrics.totalAnalyses}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Processed</p>
            <p className="mt-1 text-lg font-semibold">{data.aiMetrics.processed}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="mt-1 text-lg font-semibold">{data.aiMetrics.failed}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Possible Duplicates</p>
            <p className="mt-1 text-lg font-semibold">{data.aiMetrics.duplicates}</p>
          </div>
        </div>
        {data.aiMetrics.totalAnalyses === 0 && <p className="mt-3 text-sm text-muted-foreground">Not enough data yet.</p>}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Service Performance Table</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Complaints</th>
                <th className="text-right p-2">Open</th>
                <th className="text-right p-2">Resolved</th>
                <th className="text-right p-2">Verified</th>
                <th className="text-right p-2">Reopened</th>
                <th className="text-right p-2">Avg Resolution (hrs)</th>
                <th className="text-right p-2">Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.servicePerformance.map((sp) => (
                <tr key={`${sp.service}-${sp.category}`} className="border-b">
                  <td className="p-2 capitalize">{sp.service}</td>
                  <td className="p-2 capitalize">{sp.category.replace(/_/g, " ")}</td>
                  <td className="p-2 text-right tabular-nums">{sp.complaints}</td>
                  <td className="p-2 text-right tabular-nums">{sp.open}</td>
                  <td className="p-2 text-right tabular-nums">{sp.resolved}</td>
                  <td className="p-2 text-right tabular-nums">{sp.verified}</td>
                  <td className="p-2 text-right tabular-nums">{sp.reopened}</td>
                  <td className="p-2 text-right tabular-nums">{sp.avgResolutionHours ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{sp.avgRating ? `${sp.avgRating}/5` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.servicePerformance.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No complaint data available for this period.</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Key Insights</h3>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          {data.byCategory[0] && <li>• {data.byCategory[0].label.replace(/_/g, " ")} is the most reported category ({data.byCategory[0].value} complaints).</li>}
          {data.byLocation[0] && <li>• {data.byLocation[0].label} has the highest complaint volume ({data.byLocation[0].value} complaints).</li>}
          {stats.reopenRate !== null && <li>• Resolution reopen rate is {stats.reopenRate}% (percentage of resolved/verified complaints students reported as not fully fixed).</li>}
          {stats.averageRating !== null && <li>• Average resolution satisfaction is {stats.averageRating}/5 ({stats.ratingCount} ratings).</li>}
          {data.recurring.length > 0 && <li>• {data.recurring[0].title} appears to be a recurring issue ({data.recurring[0].reports} reports).</li>}
        </ul>
      </div>
    </div>
  );
}
