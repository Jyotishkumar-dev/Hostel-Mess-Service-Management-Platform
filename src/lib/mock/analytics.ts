import type { ChartDatum } from "@/types";
import type { ComplaintStatus } from "@/types/complaint";

/**
 * ILLUSTRATIVE MOCK DATA — NOT REAL CAMPUS STATISTICS.
 *
 * These series are hand-written sample values created to demonstrate the chart
 * components and the analytics layout. They are NOT measurements from any real
 * campus and must not be presented as such. Phase 2 replaces this file with
 * aggregate queries run against Supabase.
 */

export const MOCK_ISSUES_OVER_TIME: ChartDatum[] = [
  { label: "Mar 3", value: 14 },
  { label: "Mar 4", value: 19 },
  { label: "Mar 5", value: 17 },
  { label: "Mar 6", value: 23 },
  { label: "Mar 7", value: 21 },
  { label: "Mar 8", value: 26 },
  { label: "Mar 9", value: 24 },
  { label: "Mar 10", value: 31 },
  { label: "Mar 11", value: 28 },
  { label: "Mar 12", value: 34 },
  { label: "Mar 13", value: 30 },
  { label: "Mar 14", value: 38 },
  { label: "Mar 15", value: 36 },
  { label: "Mar 16", value: 41 },
];

/** Hostel vs mess split, stacked. */
export interface AreaOverTimeDatum {
  label: string;
  hostel: number;
  mess: number;
}

export const MOCK_AREAS_OVER_TIME: AreaOverTimeDatum[] = [
  { label: "Mar 10", hostel: 19, mess: 12 },
  { label: "Mar 11", hostel: 17, mess: 11 },
  { label: "Mar 12", hostel: 21, mess: 13 },
  { label: "Mar 13", hostel: 18, mess: 12 },
  { label: "Mar 14", hostel: 24, mess: 14 },
  { label: "Mar 15", hostel: 22, mess: 14 },
  { label: "Mar 16", hostel: 26, mess: 15 },
];

export const MOCK_BY_CATEGORY: ChartDatum[] = [
  { label: "Water supply", value: 46 },
  { label: "Food quality", value: 38 },
  { label: "Electricity", value: 31 },
  { label: "Cleanliness", value: 27 },
  { label: "Maintenance", value: 22 },
  { label: "Food hygiene", value: 16 },
  { label: "Internet", value: 12 },
  { label: "Security", value: 8 },
];

export const MOCK_BY_PRIORITY: ChartDatum[] = [
  { label: "Critical", value: 14 },
  { label: "High", value: 37 },
  { label: "Medium", value: 58 },
  { label: "Low", value: 26 },
];

export const MOCK_BY_STATUS: Array<ChartDatum & { status: ComplaintStatus }> = [
  { label: "Reported", value: 31, status: "reported" },
  { label: "Assigned", value: 29, status: "assigned" },
  { label: "In progress", value: 24, status: "in_progress" },
  { label: "Resolved", value: 71, status: "resolved" },
];

/** Recurring issues — the same problem reported more than once. */
export interface RecurringIssue {
  title: string;
  area: "hostel" | "mess";
  reports: number;
  lastReported: string;
}

export const MOCK_RECURRING_ISSUES: RecurringIssue[] = [
  {
    title: "Water supply interruptions on upper floors",
    area: "hostel",
    reports: 9,
    lastReported: "2 days ago",
  },
  {
    title: "Mess food quality complaints at lunch",
    area: "mess",
    reports: 7,
    lastReported: "1 day ago",
  },
  {
    title: "Slow response on electrical repairs",
    area: "hostel",
    reports: 5,
    lastReported: "4 days ago",
  },
  {
    title: "Washroom cleaning schedule not followed",
    area: "hostel",
    reports: 4,
    lastReported: "3 days ago",
  },
  {
    title: "Evening peak-hour internet congestion",
    area: "hostel",
    reports: 3,
    lastReported: "2 days ago",
  },
];

/** Headline numbers shown at the top of the analytics page. */
export const MOCK_ANALYTICS_STATS = {
  resolutionRate: 68,
  averageResolutionHours: 46,
  reopenedRate: 7,
  studentSatisfaction: 74,
} as const;
