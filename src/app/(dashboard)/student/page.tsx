import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  MessageSquarePlus,
  Timer,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { StatCardRow } from "@/components/dashboard/stat-card";
import { ComplaintCard } from "@/components/feedback/complaint-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STATUS_ORDER, statusStyle } from "@/config/status";
import {
  MOCK_STUDENT_COMPLAINTS,
  MOCK_STUDENT_STATS,
  MOCK_STUDENT_SUMMARY,
  recentComplaints,
} from "@/lib/mock";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function StudentDashboardPage() {
  // Deduplicated with the layout's check, so this costs no extra query.
  const user = await requireUser();
  const recent = recentComplaints(MOCK_STUDENT_COMPLAINTS, 4);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good afternoon, ${user.fullName.split(" ")[0]}`}
        description="Everything you have reported, and where each issue stands today."
        actions={
          <Button asChild>
            <Link href="/student/complaints/new">
              <MessageSquarePlus aria-hidden="true" />
              Submit feedback
            </Link>
          </Button>
        }
      />

      <StatCardRow
        stats={MOCK_STUDENT_STATS}
        icons={[ClipboardList, ListTodo, Timer, CheckCircle2]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeading
            title="Recent complaints"
            description="Your latest reports, newest first."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/student/complaints">
                  View all
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            }
            className="mb-3"
          />

          <ul className="grid gap-3">
            {recent.map((complaint) => (
              <li key={complaint.id}>
                <ComplaintCard
                  complaint={complaint}
                  href={`/student/complaints/${complaint.id}`}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How tracking works</CardTitle>
              <CardDescription>
                Every complaint moves through the same five stages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {STATUS_ORDER.map((status) => {
                  const style = statusStyle(status);
                  const count = MOCK_STUDENT_COMPLAINTS.filter(
                    (complaint) => complaint.status === status,
                  ).length;

                  return (
                    <li
                      key={status}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full ${style.dotClass}`}
                      />
                      <span className="text-muted-foreground">
                        {style.label}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your record</CardTitle>
              <CardDescription>Across all reported issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total reported</dt>
                  <dd className="font-medium tabular-nums">
                    {MOCK_STUDENT_SUMMARY.total}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Still open</dt>
                  <dd className="font-medium tabular-nums">
                    {MOCK_STUDENT_SUMMARY.open}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="font-medium tabular-nums">
                    {MOCK_STUDENT_SUMMARY.resolved}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Waiting on your confirmation
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {MOCK_STUDENT_SUMMARY.resolved}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Sample records for the Phase 1 preview. Live data is connected through
        Supabase in Phase 2.
      </p>
    </div>
  );
}