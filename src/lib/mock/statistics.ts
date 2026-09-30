import { countByStatus, MOCK_COMPLAINTS, MOCK_STUDENT_COMPLAINTS } from "@/lib/mock/complaints";
import type { Complaint, ComplaintStatus } from "@/types/complaint";

/**
 * ILLUSTRATIVE MOCK DATA — NOT REAL CAMPUS STATISTICS.
 *
 * Every figure produced here is derived from `src/lib/mock/complaints.ts`, which
 * is a small fictional dataset. These numbers exist to demonstrate the shape of
 * the dashboards, not to report anything true about a campus.
 */

export interface StatTile {
  label: string;
  value: number;
  /** Secondary line, e.g. "3 need attention". */
  hint: string;
  /** Rendered after the number, e.g. "%" or " days". */
  suffix?: string;
}

export interface ComplaintSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  reopened: number;
  critical: number;
  /** Whole percentage, 0–100. */
  resolutionRate: number;
}

const OPEN_STATUSES: ComplaintStatus[] = ["reported", "assigned"];

export function summarise(complaints: Complaint[]): ComplaintSummary {
  const total = complaints.length;
  const resolved = countByStatus(complaints, "resolved");
  const critical = complaints.filter(
    (complaint) => complaint.priority === "critical",
  ).length;

  // "Open" means still waiting to be picked up — reported or assigned but not
  // yet being worked on.
  const open = complaints.filter((complaint) =>
    OPEN_STATUSES.includes(complaint.status),
  ).length;

  return {
    total,
    open,
    inProgress: countByStatus(complaints, "in_progress"),
    resolved,
    reopened: countByStatus(complaints, "reopened"),
    critical,
    resolutionRate: total === 0 ? 0 : Math.round((resolved / total) * 100),
  };
}

export const MOCK_STUDENT_SUMMARY = summarise(MOCK_STUDENT_COMPLAINTS);
export const MOCK_CAMPUS_SUMMARY = summarise(MOCK_COMPLAINTS);

/** The four headline tiles on the student dashboard. */
export const MOCK_STUDENT_STATS: StatTile[] = [
  {
    label: "Total complaints",
    value: MOCK_STUDENT_SUMMARY.total,
    hint: "Everything you have reported",
  },
  {
    label: "Open",
    value: MOCK_STUDENT_SUMMARY.open,
    hint: "Waiting to be picked up",
  },
  {
    label: "In progress",
    value: MOCK_STUDENT_SUMMARY.inProgress,
    hint: "Work underway on campus",
  },
  {
    label: "Resolved",
    value: MOCK_STUDENT_SUMMARY.resolved,
    hint: "Closed and awaiting your check",
  },
];

/** The four headline tiles on the admin dashboard. */
export const MOCK_ADMIN_STATS: StatTile[] = [
  {
    label: "Total issues",
    value: MOCK_CAMPUS_SUMMARY.total,
    hint: "Across hostel and mess services",
  },
  {
    label: "Open issues",
    value: MOCK_CAMPUS_SUMMARY.open,
    hint: "Not yet in progress",
  },
  {
    label: "Critical issues",
    value: MOCK_CAMPUS_SUMMARY.critical,
    hint: "Safety or hygiene related",
  },
  {
    label: "Resolution rate",
    value: MOCK_CAMPUS_SUMMARY.resolutionRate,
    hint: "Share of issues closed",
    suffix: "%",
  },
];

/** The four headline tiles on the staff dashboard. */
export function staffStats(assigned: Complaint[]): StatTile[] {
  const summary = summarise(assigned);
  const highPriority = assigned.filter(
    (complaint) =>
      complaint.priority === "critical" || complaint.priority === "high",
  ).length;

  return [
    {
      label: "Assigned issues",
      value: summary.total,
      hint: "Currently on your list",
    },
    {
      label: "In progress",
      value: summary.inProgress,
      hint: "Work you have started",
    },
    {
      label: "Resolved",
      value: summary.resolved,
      hint: "Completed this cycle",
    },
    {
      label: "High priority",
      value: highPriority,
      hint: "Critical or high severity",
    },
  ];
}

/**
 * Most recently reported complaints. `MOCK_COMPLAINTS` is already ordered
 * newest first, so this is a simple slice.
 */
export function recentComplaints(
  complaints: Complaint[],
  limit = 5,
): Complaint[] {
  return complaints.slice(0, limit);
}
