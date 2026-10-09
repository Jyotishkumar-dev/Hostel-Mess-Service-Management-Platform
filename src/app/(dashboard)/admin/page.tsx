import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  CircleDashed,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { CategoryBarChart, DonutChart } from "@/components/dashboard/charts";
import { ComplaintTable } from "@/components/feedback/complaint-table";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { listAllComplaints } from "@/lib/admin/queries";
import { summarise, type StatTile } from "@/lib/mock/statistics";
import {
  CATEGORY_LABELS,
  STATUS_ORDER,
  STATUS_STYLES,
} from "@/config/status";
import { StatusDot } from "@/components/feedback/status-badges";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
} from "@/types/complaint";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

/** Headline tiles, derived from the live complaint register. */
function adminStatTiles(summary: ReturnType<typeof summarise>): StatTile[] {
  const reopened = summary.reopened ?? 0;
  return [
    {
      label: "Total issues",
      value: summary.total,
      hint: "Across hostel and mess services",
    },
    {
      label: "Open issues",
      value: summary.open,
      hint: "Not yet in progress",
    },
    {
      label: "Critical issues",
      value: summary.critical,
      hint: "Safety or hygiene related",
    },
    {
      label: "Reopened issues",
      value: reopened,
      hint: "Returned for further action",
    },
    {
      label: "Resolution rate",
      value: summary.resolutionRate,
      hint: "Share of issues closed",
      suffix: "%",
    },
  ];
}

/** All statuses for the admin overview, including reopened and verified. */
const ADMIN_STATUSES: ComplaintStatus[] = [
  "reported",
  "assigned",
  "in_progress",
  "resolved",
  "reopened",
  "verified",
];

/** Counts per status, in workflow order, dropping zero buckets from the donut. */
function statusCounts(complaints: Complaint[]) {
  return ADMIN_STATUSES.map((status) => ({
    label: STATUS_STYLES[status].label,
    value: complaints.filter((c) => c.status === status).length,
  })).filter((entry) => entry.value > 0);
}

/** Counts per category, descending, for the bar chart. */
function categoryCounts(complaints: Complaint[]) {
  const tally = complaints.reduce(
    (acc, complaint) => {
      acc[complaint.category] = (acc[complaint.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(tally)
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category as ComplaintCategory],
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export default async function AdminDashboardPage() {
  const result = await listAllComplaints();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Campus service health"
          description="A single view of what is open, what is critical and where the recurring problems are."
        />
        <EmptyState
          icon={ListChecks}
          title="We could not load the dashboard"
          description={result.error}
          action={
            <Button asChild variant="outline">
              <Link href="/admin">Try again</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const complaints = result.data;
  const summary = summarise(complaints);

  const needsTriage = complaints
    .filter((c) => c.status === "reported")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campus service health"
        description="A single view of what is open, what is critical and where the recurring problems are."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/issues">
              Open the issue register
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <StatCardRow
        stats={adminStatTiles(summary)}
        icons={[ClipboardList, ListChecks, AlertOctagon, Clock]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Issues by category"
          description="Where reports tend to cluster across hostel and mess services."
        >
          <CategoryBarChart data={categoryCounts(complaints)} />
        </ChartCard>

        <ChartCard
          title="Open by status"
          description="Where the current backlog sits."
        >
          <DonutChart data={statusCounts(complaints)} height={200} />
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
            {needsTriage.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Triage is clear"
                description="Every reported issue has been reviewed and routed to a team."
              />
            ) : (
              <ComplaintTable
                complaints={needsTriage}
                caption="Issues awaiting triage"
                basePath="/admin/issues"
                showStudent
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Open by status"
            description="Counts for each stage of the workflow."
            className="mb-3"
          />

          <ul className="rounded-xl bg-card ring-1 ring-foreground/10">
            {ADMIN_STATUSES.map((status) => {
              const count = complaints.filter(
                (c) => c.status === status,
              ).length;
              const Icon = STATUS_ICON[status];
              return (
                <li
                  key={status}
                  className="flex items-center gap-3 px-4 py-3 not-last:border-b"
                >
                  <StatusDot status={status} />
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm">{STATUS_STYLES[status].label}</span>
                  <span className="ml-auto font-medium tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
