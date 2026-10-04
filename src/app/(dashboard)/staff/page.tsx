import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Timer,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ComplaintCard } from "@/components/feedback/complaint-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { listStaffComplaints } from "@/lib/complaints/queries";
import type { Complaint, ComplaintPriority } from "@/types/complaint";
import type { StatTile } from "@/lib/mock/statistics";

export const metadata: Metadata = {
  title: "Staff Dashboard",
};

const PRIORITY_ORDER: ComplaintPriority[] = ["critical", "high", "medium", "low"];

/** Sorts the work-that-matters-most to the top: priority, then oldest first. */
function urgentFirst(complaints: Complaint[]): Complaint[] {
  return [...complaints].sort((a, b) => {
    const byPriority =
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    if (byPriority !== 0) return byPriority;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export default async function StaffDashboardPage() {
  const result = await listStaffComplaints();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Your work"
          description="Issues routed to you by the admin, most urgent first."
        />
        <EmptyState
          icon={ListChecks}
          title="We could not load your dashboard"
          description={result.error}
          action={
            <Button asChild variant="outline">
              <Link href="/staff">Try again</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const complaints = result.data;

  const pending = complaints.filter((c) => c.status === "assigned").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;
  const resolved = complaints.filter((c) => c.status === "resolved").length;

  const todo = complaints.filter((c) => c.status !== "resolved");
  const urgent = urgentFirst(
    todo.filter((c) => c.priority === "critical" || c.priority === "high"),
  ).slice(0, 3);
  const done = complaints
    .filter((c) => c.status === "resolved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const stats: StatTile[] = [
    { label: "Assigned to me", value: complaints.length, hint: "Issues routed to you" },
    {
      label: "Needs attention",
      value: pending,
      hint: "Assigned, not started yet",
    },
    { label: "In progress", value: inProgress, hint: "Work underway" },
    { label: "Resolved", value: resolved, hint: "Completed this cycle" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your work"
        description="Issues routed to you by the admin, most urgent first."
        actions={
          <Button asChild variant="outline">
            <Link href="/staff/issues">
              <ListChecks aria-hidden="true" />
              All assigned issues
            </Link>
          </Button>
        }
      />

      <StatCardRow
        stats={stats}
        icons={[ClipboardList, ListChecks, Timer, CheckCircle2]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeading
            title="Needs attention"
            description="High and critical issues that are not closed yet."
            className="mb-3"
          />

          {urgent.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing urgent"
              description="No critical or high-priority work is open on your list right now."
            />
          ) : (
            <ul className="grid gap-3">
              {urgent.map((complaint) => (
                <li key={complaint.id}>
                  <ComplaintCard
                    complaint={complaint}
                    href={`/staff/issues/${complaint.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeading
            title="Recently closed"
            description="Work you have already completed."
            className="mb-3"
          />

          {done.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed work yet"
              description="Issues you resolve will be listed here once marked complete."
            />
          ) : (
            <ul className="rounded-xl bg-card ring-1 ring-foreground/10">
              {done.map((complaint) => (
                <li
                  key={complaint.id}
                  className="px-4 py-3.5 not-last:border-b"
                >
                  <Link
                    href={`/staff/issues/${complaint.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {complaint.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {complaint.location} · resolved {complaint.updatedAt}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <Button asChild variant="ghost" size="sm" className="mt-3">
            <Link href="/staff/issues">
              View the full list
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {complaints.length}{" "}
        {complaints.length === 1 ? "issue" : "issues"} assigned to you.
      </p>
    </div>
  );
}
