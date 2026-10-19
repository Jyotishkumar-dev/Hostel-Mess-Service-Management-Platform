import "server-only";

import { cache } from "react";
import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";
import type { Complaint } from "@/types/complaint";
import { listAllComplaints } from "@/lib/admin/queries";

export type DateRange = "7d" | "30d" | "90d" | "semester" | "custom";
export type ServiceFilter = "all" | "hostel" | "mess";

export interface AnalyticsFilters {
  dateRange: DateRange;
  service: ServiceFilter;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsStats {
  totalComplaints: number;
  openIssues: number;
  resolved: number;
  verified: number;
  reopened: number;
  averageResolutionHours: number | null;
  medianResolutionHours: number | null;
  reopenRate: number | null;
  averageRating: number | null;
  ratingCount: number;
}

export interface ComplaintTrendDatum {
  label: string;
  value: number;
}

export interface HostelVsMessDatum {
  label: string;
  hostel: number;
  mess: number;
}

export interface CategoryBreakdownDatum {
  label: string;
  value: number;
}

export interface PriorityBreakdownDatum {
  label: string;
  value: number;
}

export interface StatusBreakdownDatum {
  label: string;
  value: number;
  status: string;
}

export interface LocationBreakdownDatum {
  label: string;
  value: number;
}

export interface RecurringIssue {
  key: string;
  title: string;
  area: "hostel" | "mess";
  category: string;
  location: string;
  reports: number;
  lastReported: string;
}

export interface ServicePerformanceRow {
  service: "hostel" | "mess";
  category: string;
  complaints: number;
  open: number;
  resolved: number;
  verified: number;
  reopened: number;
  avgResolutionHours: number | null;
  avgRating: number | null;
  ratingCount: number;
}

export interface ResolutionOutcomeBreakdown {
  awaitingVerification: number;
  verified: number;
  reopened: number;
}

export interface ResolutionTimeOverTimeDatum {
  label: string;
  avgHours: number | null;
}

export interface AiProcessingMetrics {
  totalAnalyses: number;
  processed: number;
  failed: number;
  duplicates: number;
}

export interface ServiceHealthItem {
  key: string;
  service: "hostel" | "mess";
  category: string;
  label: string;
  status: "good" | "watch" | "needs_attention";
  score: number;
  complaints: number;
  reopenRate: number | null;
  avgResolutionHours: number | null;
  avgRating: number | null;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  trends: ComplaintTrendDatum[];
  hostelVsMess: HostelVsMessDatum[];
  byCategory: CategoryBreakdownDatum[];
  byLocation: LocationBreakdownDatum[];
  byPriority: PriorityBreakdownDatum[];
  byStatus: StatusBreakdownDatum[];
  recurring: RecurringIssue[];
  servicePerformance: ServicePerformanceRow[];
  resolutionOutcome: ResolutionOutcomeBreakdown;
  resolutionTimeOverTime: ResolutionTimeOverTimeDatum[];
  aiMetrics: AiProcessingMetrics;
  serviceHealth: ServiceHealthItem[];
  dateRangeLabel: string;
  totalFiltered: number;
}

function inDateRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" });
  return `${fmt.format(start)}–${fmt.format(end)}`;
}

function hoursBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const diffMs = e.getTime() - s.getTime();
  if (diffMs < 0) return null;
  return diffMs / (1000 * 60 * 60);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function getDateRange(filter: AnalyticsFilters): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date(end);

  switch (filter.dateRange) {
    case "7d":
      start.setDate(end.getDate() - 7);
      return { start, end, label: "Last 7 days" };
    case "30d":
      start.setDate(end.getDate() - 30);
      return { start, end, label: "Last 30 days" };
    case "90d":
      start.setDate(end.getDate() - 90);
      return { start, end, label: "Last 90 days" };
    case "semester":
      start.setMonth(end.getMonth() - 4);
      return { start, end, label: "This semester (approx.)" };
    case "custom": {
      if (filter.startDate && filter.endDate) {
        const cs = new Date(filter.startDate);
        const ce = new Date(filter.endDate);
        if (!isNaN(cs.getTime()) && !isNaN(ce.getTime())) {
          ce.setHours(23, 59, 59, 999);
          return { start: cs, end: ce, label: "Custom range" };
        }
      }
      start.setDate(end.getDate() - 30);
      return { start, end, label: "Last 30 days" };
    }
    default:
      start.setDate(end.getDate() - 30);
      return { start, end, label: "Last 30 days" };
  }
}
