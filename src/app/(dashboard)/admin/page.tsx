import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  ArrowRight,
  Flame,
  ListChecks,
  ListTodo,
  Timer,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { TrendAreaChart, DonutChart } from "@/components/dashboard/charts";
import { ComplaintTable } from "@/components/feedback/complaint-table";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import {
  MOCK_ADMIN_STATS,
  MOCK_BY_STATUS,
  MOCK_COMPLAINTS,
  MOCK_ISSUES_OVER_TIME,
  MOCK_RECURRING_ISSUES,
} from "@/lib/mock";
import { AREA_LABELS } from "@/config/status";
import { StatusDot } from "@/components/feedback/status-badges";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

/** Issues that need a decision today, newest first. */
const NEEDS_TRIAGE = MOCK_COMPLAINTS.filter(
  (complaint) => complaint.status === "reported",
);

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campus service health"
        description="A single view of what is open, what is critical and where the recurring problems are."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/analytics">
              Open analytics
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <StatCardRow
        stats={MOCK_ADMIN_STATS}
        icons={[ClipboardList, ListTodo, Flame, Timer]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Issues reported over time"
          description="Daily volume across hostel and mess services."
          note="Illustrative sample data. Live figures are calculated from Supabase in Phase 2."
        >
          <TrendAreaChart
            data={MOCK_ISSUES_OVER_TIME}
            name="Issues reported"
          />
        </ChartCard>

        <ChartCard
          title="Open by status"
          description="Where the current backlog sits."
          note="Illustrative sample data."
        >
          <DonutChart data={MOCK_BY_STATUS} height={200} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeading
            title="Waiting for triage"
            description="Newly reported issues that have no owner yet."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/issues">
                  Open the register
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            }
            className="mb-3"
          />

          <div className="rounded-xl bg-card ring-1 ring-foreground/10">
            {NEEDS_TRIAGE.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={ListChecks}
                  title="Triage is clear"
                  description="Every reported issue has been reviewed and routed to a team."
                />
              </div>
            ) : (
              <ComplaintTable
                complaints={NEEDS_TRIAGE}
                caption="Issues awaiting triage"
                basePath="/admin/issues"
                showStudent
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Recurring problems"
            description="Issues reported more than once."
            className="mb-3"
          />

          <ul className="rounded-xl bg-card ring-1 ring-foreground/10">
            {MOCK_RECURRING_ISSUES.map((issue, index) => (
              <li
                key={issue.title}
                className="flex items-start gap-3 px-4 py-3.5 not-last:border-b"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{issue.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {AREA_LABELS[issue.area]} · {issue.reports} reports ·{" "}
                    {issue.lastReported}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_BY_STATUS.map((entry) => (
          <div
            key={entry.status}
            className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
          >
            <StatusDot status={entry.status} />
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {entry.value}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        All figures on this page are illustrative sample data for the Phase 1
        preview.
      </p>
    </div>
  );
}
