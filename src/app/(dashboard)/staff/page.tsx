import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Flame,
  ListChecks,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ComplaintCard } from "@/components/feedback/complaint-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { MOCK_ASSIGNED_COMPLAINTS } from "@/lib/mock";
import { staffStats } from "@/lib/mock/statistics";
import { MOCK_SESSIONS } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Staff Dashboard",
};

export default function StaffDashboardPage() {
  const user = MOCK_SESSIONS.staff;
  const assigned = MOCK_ASSIGNED_COMPLAINTS;

  /** Sorted so the work that matters most is at the top. */
  const todo = assigned.filter((complaint) => complaint.status !== "resolved");
  const urgent = todo
    .filter(
      (complaint) =>
        complaint.priority === "critical" || complaint.priority === "high",
    )
    .slice(0, 3);
  const done = assigned.filter((complaint) => complaint.status === "resolved");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Your work, ${user.name.split(" ")[0]}`}
        description="Assigned issues for the maintenance team, most urgent first."
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
        stats={staffStats(assigned)}
        icons={[ClipboardList, Timer, CheckCircle2, Flame]}
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
            description="Completed and confirmed by the student."
            className="mb-3"
          />

          {done.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed work yet"
              description="Issues you resolve will be listed here once the student confirms the fix."
            />
          ) : (
            <ul className="rounded-xl bg-card ring-1 ring-foreground/10">
              {done.slice(0, 4).map((complaint) => (
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
        Sample records for the Phase 1 preview. Status updates and resolution
        notes are saved through Supabase in Phase 2.
      </p>
    </div>
  );
}
