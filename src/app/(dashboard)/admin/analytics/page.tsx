import type { Metadata } from "next";
import { ChartNoAxesColumn, Clock, Repeat2, Timer, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import {
  CategoryBarChart,
  DonutChart,
  StackedAreaChart,
  TrendAreaChart,
} from "@/components/dashboard/charts";
import { AREA_LABELS } from "@/config/status";
import {
  MOCK_ANALYTICS_STATS,
  MOCK_AREAS_OVER_TIME,
  MOCK_BY_CATEGORY,
  MOCK_BY_PRIORITY,
  MOCK_BY_STATUS,
  MOCK_ISSUES_OVER_TIME,
  MOCK_RECURRING_ISSUES,
} from "@/lib/mock";

export const metadata: Metadata = {
  title: "Analytics",
};

const STATS = [
  {
    label: "Resolution rate",
    value: MOCK_ANALYTICS_STATS.resolutionRate,
    hint: "Issues closed within the current cycle",
    suffix: "%",
  },
  {
    label: "Average resolution time",
    value: MOCK_ANALYTICS_STATS.averageResolutionHours,
    hint: "Hours from report to resolved",
    suffix: " hrs",
  },
  {
    label: "Reopened rate",
    value: MOCK_ANALYTICS_STATS.reopenedRate,
    hint: "Fixes the student rejected",
    suffix: "%",
  },
  {
    label: "Satisfaction score",
    value: MOCK_ANALYTICS_STATS.studentSatisfaction,
    hint: "Post-resolution feedback index",
    suffix: "%",
  },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ChartNoAxesColumn}
        title="Service analytics"
        description="Where campus services improve, and where the same problems keep coming back."
      />

      <StatCardRow stats={STATS} icons={[Timer, Clock, Undo2, Repeat2]} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Issues over time"
          description="Daily volume reported across both service areas."
          note="Illustrative sample data, not measured campus statistics."
        >
          <TrendAreaChart data={MOCK_ISSUES_OVER_TIME} name="Issues" />
        </ChartCard>

        <ChartCard
          title="Hostel vs mess"
          description="Where the pressure is coming from each day."
          note="Illustrative sample data, not measured campus statistics."
        >
          <StackedAreaChart
            data={MOCK_AREAS_OVER_TIME}
            series={[
              {
                dataKey: "hostel",
                name: "Hostel",
                color: "var(--color-chart-1)",
              },
              {
                dataKey: "mess",
                name: "Mess",
                color: "var(--color-chart-2)",
              },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Complaints by category"
          description="Which services generate the most reports."
          note="Illustrative sample data, not measured campus statistics."
        >
          <CategoryBarChart data={MOCK_BY_CATEGORY} height={300} />
        </ChartCard>

        <div className="flex flex-col gap-4">
          <ChartCard
            title="Priority mix"
            description="How issues are weighted."
            note="Illustrative sample data."
          >
            <DonutChart data={MOCK_BY_PRIORITY} height={190} />
          </ChartCard>

          <ChartCard title="Status split" description="Backlog composition.">
            <DonutChart data={MOCK_BY_STATUS} height={190} />
          </ChartCard>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-tight">
          Recurring issues
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Problems reported more than once in the current cycle.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Recurring issues ranked by number of reports
            </caption>
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Issue
                </th>
                <th
                  scope="col"
                  className="hidden w-28 px-4 py-2.5 font-medium sm:table-cell"
                >
                  Area
                </th>
                <th
                  scope="col"
                  className="w-20 px-4 py-2.5 text-right font-medium"
                >
                  Reports
                </th>
                <th
                  scope="col"
                  className="hidden w-32 px-4 py-2.5 text-right font-medium sm:table-cell"
                >
                  Last reported
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECURRING_ISSUES.map((issue) => (
                <tr key={issue.title} className="not-last:border-b">
                  <td className="px-4 py-3">{issue.title}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {AREA_LABELS[issue.area]}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {issue.reports}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                    {issue.lastReported}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Every figure on this page is illustrative sample data prepared for the
        Phase 1 preview. Real analytics are computed from Supabase in Phase 2.
      </p>
    </div>
  );
}
