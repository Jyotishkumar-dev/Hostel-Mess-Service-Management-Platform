import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { listAllComplaints, listStaffProfiles } from "@/lib/admin/queries";
import { STATUS_STYLES } from "@/config/status";
import type { Complaint } from "@/types/complaint";

export const metadata: Metadata = {
  title: "Staff",
};

function initialsOf(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Count of complaints, by status, assigned to a single staff member. */
function workloadFor(
  memberId: string,
  complaints: Complaint[],
): {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
} {
  const assigned = complaints.filter(
    (complaint) => complaint.assignedStaff?.id === memberId,
  );

  return {
    total: assigned.length,
    open: assigned.filter((c) => c.status === "reported").length,
    inProgress: assigned.filter((c) => c.status === "in_progress").length,
    resolved: assigned.filter((c) => c.status === "resolved").length,
    critical: assigned.filter((c) => c.priority === "critical").length,
  };
}

export default async function AdminStaffPage() {
  const staffResult = await listStaffProfiles();

  if (!staffResult.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader icon={Users} title="Support staff" description="Who owns work on campus." />
        <EmptyState
          icon={Users}
          title="We could not load the staff directory"
          description={staffResult.error}
        />
      </div>
    );
  }

  const complaintsResult = await listAllComplaints();
  const complaints: Complaint[] = complaintsResult.ok
    ? complaintsResult.data
    : [];

  const staff = staffResult.data;

  if (staff.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Users}
          title="Support staff"
          description="Who owns work on campus, and how much is currently on their plate."
        />
        <EmptyState
          icon={Users}
          title="No staff records"
          description="Staff profiles are created during onboarding and stored in Supabase."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users}
        title="Support staff"
        description="Who owns work on campus, and how much is currently on their plate."
      />

      <section aria-labelledby="workload-heading">
        <SectionHeading
          title="Team workload"
          description="Open, in-progress and resolved work per staff member."
          className="mb-3"
        />

        {/* Desktop: a scannable table. */}
        <div className="scrollbar-subtle hidden overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10 md:block">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Support staff and their current workload
            </caption>
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                <th
                  scope="col"
                  className="hidden px-4 py-2.5 font-medium lg:table-cell"
                >
                  Role
                </th>
                <th scope="col" className="w-20 px-4 py-2.5 text-right font-medium">
                  Assigned
                </th>
                <th
                  scope="col"
                  className="w-20 px-4 py-2.5 text-right font-medium"
                >
                  Open
                </th>
                <th
                  scope="col"
                  className="w-24 px-4 py-2.5 text-right font-medium"
                >
                  In progress
                </th>
                <th
                  scope="col"
                  className="w-24 px-4 py-2.5 text-right font-medium"
                >
                  Resolved
                </th>
                <th
                  scope="col"
                  className="w-24 px-4 py-2.5 text-right font-medium"
                >
                  Critical
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const load = workloadFor(member.id, complaints);

                return (
                  <tr key={member.id} className="not-last:border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                          {initialsOf(member.name)}
                        </span>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {member.role}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{load.total}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{load.open}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {load.inProgress}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {load.resolved}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {load.critical}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile: the same data as cards. */}
        <ul className="grid gap-3 md:hidden">
          {staff.map((member) => {
            const load = workloadFor(member.id, complaints);

            return (
              <li
                key={member.id}
                className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {initialsOf(member.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 flex gap-6 text-xs text-muted-foreground">
                  <div>
                    <dt>Assigned</dt>
                    <dd className="text-sm font-medium text-foreground tabular-nums">
                      {load.total}
                    </dd>
                  </div>
                  <div>
                    <dt>Open</dt>
                    <dd className="text-sm font-medium text-foreground tabular-nums">
                      {load.open}
                    </dd>
                  </div>
                  <div>
                    <dt>Resolved</dt>
                    <dd className="text-sm font-medium text-foreground tabular-nums">
                      {load.resolved}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionHeading
          title="Campus backlog"
          description="Where every open issue sits right now."
          className="mb-3"
        />

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["reported", "assigned", "in_progress", "resolved", "reopened"] as const).map(
            (status) => {
              const count = complaints.filter((c) => c.status === status).length;
              return (
                <li
                  key={status}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
                >
                  <span className={STATUS_STYLES[status].dotClass} />
                  <span className="text-sm">{STATUS_STYLES[status].label}</span>
                  <span className="ml-auto font-medium tabular-nums">{count}</span>
                </li>
              );
            },
          )}
        </ul>
      </section>
    </div>
  );
}
