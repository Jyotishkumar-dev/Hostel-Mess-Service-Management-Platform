import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { AREA_LABELS } from "@/config/status";
import { MOCK_COMPLAINTS, MOCK_STAFF } from "@/lib/mock";
import type { ServiceArea, StaffMember } from "@/types/complaint";

export const metadata: Metadata = {
  title: "Staff",
};

/** Workload per staff member, derived from the mock complaint list. */
function workloadFor(member: StaffMember) {
  const assigned = MOCK_COMPLAINTS.filter(
    (complaint) => complaint.assignedStaff?.id === member.id,
  );

  return {
    total: assigned.length,
    open: assigned.filter((complaint) => complaint.status !== "resolved").length,
    resolved: assigned.filter((complaint) => complaint.status === "resolved")
      .length,
    critical: assigned.filter((complaint) => complaint.priority === "critical")
      .length,
  };
}

/** Short label for the team a staff member belongs to. */
const TEAM_LABELS: Record<string, string> = {
  "Hostel Operations": "Hostel ops",
  "Mess Services": "Mess",
  Facilities: "Facilities",
  "IT Services": "IT",
  "Hostel Security": "Security",
};

const AREA_TEAMS: Record<ServiceArea, string[]> = {
  hostel: ["Hostel Operations", "Hostel Security", "Facilities"],
  mess: ["Mess Services"],
};

export default function AdminStaffPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users}
        title="Support staff"
        description="Who owns work on campus, and how much is currently on their plate."
      />

      {MOCK_STAFF.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff records"
          description="Staff profiles are created in Phase 2 and stored in Supabase."
        />
      ) : (
        <section aria-labelledby="workload-heading">
          <SectionHeading
            title="Team workload"
            description="Derived from the sample issue register."
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
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Name
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-2.5 font-medium lg:table-cell"
                  >
                    Role
                  </th>
                  <th scope="col" className="w-28 px-4 py-2.5 font-medium">
                    Team
                  </th>
                  <th
                    scope="col"
                    className="w-24 px-4 py-2.5 text-right font-medium"
                  >
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
                    Critical
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_STAFF.map((member) => {
                  const load = workloadFor(member);

                  return (
                    <tr key={member.id} className="not-last:border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                            {member.initials}
                          </span>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {member.role}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TEAM_LABELS[member.team] ?? member.team}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {load.total}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {load.open}
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
            {MOCK_STAFF.map((member) => {
              const load = workloadFor(member);

              return (
                <li
                  key={member.id}
                  className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {member.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
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
                      <dt>Critical</dt>
                      <dd className="text-sm font-medium text-foreground tabular-nums">
                        {load.critical}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <SectionHeading
          title="Coverage by area"
          description="Which team owns which part of campus life."
          className="mb-3"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(AREA_TEAMS) as ServiceArea[]).map((area) => {
            const teamMembers = MOCK_STAFF.filter((member) =>
              AREA_TEAMS[area].includes(member.team),
            );

            return (
              <div
                key={area}
                className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
              >
                <p className="text-sm font-medium">{AREA_LABELS[area]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {teamMembers.length} team members
                </p>
                <ul className="mt-3 space-y-1.5">
                  {teamMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {member.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {workloadFor(member).open} open
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Staff profiles and workload figures are sample data for the Phase 1
        preview. Live records are stored in Supabase from Phase 2.
      </p>
    </div>
  );
}
