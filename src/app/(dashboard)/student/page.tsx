import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  AlertTriangle,
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
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STATUS_ORDER, statusStyle } from "@/config/status";
import { formatNumber } from "@/lib/format";
import { listMyComplaints, summariseComplaints } from "@/lib/complaints/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

const RECENT_LIMIT = 4;

/**
 * The student dashboard.
 *
 * Every number here is counted from the signed-in student's own complaints,
 * which the `complaints_select_own` RLS policy has already narrowed down. There
 * is no mock data left in this file: the dashboard and the complaints list read
 * the same rows, so the counts can never disagree with the list.
 */
export default async function StudentDashboardPage() {
  // Deduplicated with the layout's check, so this costs no extra query.
  const user = await requireUser();
  const result = await listMyComplaints();

  const firstName = user.fullName.split(" ")[0];
  const greeting = greetingFor(new Date().getHours());

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`${greeting}, ${firstName}`}
          description="Everything you have reported, and where each issue stands today."
        />
        <EmptyState
          icon={AlertTriangle}
          title="We could not load your dashboard"
          description={result.error}
          action={
            <Button asChild variant="outline">
              <Link href="/student">Try again</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const complaints = result.data;
  const stats = summariseComplaints(complaints);
  const recent = complaints.slice(0, RECENT_LIMIT);
  const open = stats.total - stats.resolved;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Everything you have reported, and where each issue stands today."
        actions={
          <Button asChild>
            <Link href="/student/complaints/new">
              <MessageSquarePlus aria-hidden="true" />
              Submit Feedback
            </Link>
          </Button>
        }
      />

      <StatCardRow
        stats={[
          {
            label: "Total complaints",
            value: stats.total,
            hint:
              stats.total === 0
                ? "Nothing reported yet"
                : "All time",
          },
          {
            label: "Reported",
            value: stats.reported,
            hint: "Waiting to be picked up",
          },
          {
            label: "In progress",
            value: stats.inProgress,
            hint: "Being worked on",
          },
          {
            label: "Awaiting verification",
            value: stats.awaitingVerification,
            hint: "Resolution needs your confirmation",
          },
          {
            label: "Verified",
            value: stats.verified,
            hint: "Confirmed by you",
          },
        ]}
        icons={[ClipboardList, ListTodo, Timer, CheckCircle2, CheckCircle2]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeading
            title="Recent Feedback"
            description="Your latest reports, newest first."
            action={
              complaints.length > 0 ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/student/complaints">
                    View all
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null
            }
            className="mb-3"
          />

          {recent.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="No feedback submitted yet"
              description="If something in your hostel or mess needs attention, submit your first feedback and we will pass it to the right team."
              action={
                <Button asChild>
                  <Link href="/student/complaints/new">Submit Feedback</Link>
                </Button>
              }
            />
          ) : (
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
          )}
        </section>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How tracking works</CardTitle>
              <CardDescription>
                Every complaint moves through the same stages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {STATUS_ORDER.map((status) => {
                  const style = statusStyle(status);
                  const count = complaints.filter(
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
              <CardDescription>Across all your reported issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total reported</dt>
                  <dd className="font-medium tabular-nums">
                    {formatNumber(stats.total)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Still open</dt>
                  <dd className="font-medium tabular-nums">
                    {formatNumber(open)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd className="font-medium tabular-nums">
                    {formatNumber(stats.resolved)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** "Good morning" / "Good afternoon" / "Good evening", by server hour. */
function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}