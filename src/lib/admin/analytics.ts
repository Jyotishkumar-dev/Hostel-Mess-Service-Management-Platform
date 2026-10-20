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

function normalizeLocation(location: string): string {
  return location.trim().toLowerCase();
}

function inferBlock(location: string): string {
  const norm = location.toLowerCase();
  if (norm.includes("block a")) return "Block A";
  if (norm.includes("block b")) return "Block B";
  if (norm.includes("block c")) return "Block C";
  if (norm.includes("block d")) return "Block D";
  if (norm.includes("block e")) return "Block E";
  if (norm.includes("block f")) return "Block F";
  if (norm.match(/block\s+\w/i)) {
    const m = location.match(/block\s+([a-zA-Z])/i);
    if (m) return `Block ${m[1].toUpperCase()}`;
  }
  return location || "Unknown";
}

function getHealthStatus(score: number): "good" | "watch" | "needs_attention" {
  if (score >= 75) return "good";
  if (score >= 60) return "watch";
  return "needs_attention";
}

export const getAnalyticsData = cache(
  async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
    await requireRole("admin");

    const complaintsResult = await listAllComplaints();
    const complaints: Complaint[] = complaintsResult.ok ? complaintsResult.data : [];

    const supabase = await createTypedServerClient();
    let aiAnalyses: Array<{ complaint_id: string; processing_status: string; duplicate_candidate: boolean }> = [];

    if (supabase) {
      try {
        const { data } = await supabase.from("complaint_ai_analysis").select("*");
        if (data) {
          aiAnalyses = (data as Array<Record<string, unknown>>).map((row) => ({
            complaint_id: String(row.complaint_id),
            processing_status: String(row.processing_status || "pending"),
            duplicate_candidate: Boolean(row.duplicate_candidate),
          }));
        }
      } catch (e) {
        console.error("[analytics] ai load failed:", e);
      }
    }

    const range = getDateRange(filters);
    let filtered = complaints.filter((c) => inDateRange(c.createdAt, range.start, range.end));
    if (filters.service === "hostel") {
      filtered = filtered.filter((c) => c.area === "hostel");
    }
    if (filters.service === "mess") {
      filtered = filtered.filter((c) => c.area === "mess");
    }

    const totalComplaints = filtered.length;
    const openIssues = filtered.filter(
      (c) => c.status !== "resolved" && c.status !== "verified",
    ).length;
    const resolved = filtered.filter((c) => c.status === "resolved").length;
    const verified = filtered.filter((c) => c.status === "verified").length;
    const reopened = filtered.filter((c) => c.status === "reopened").length;

    const resolutionHours: number[] = [];
    for (const c of filtered) {
      if ((c.status === "resolved" || c.status === "verified") && c.resolvedAt) {
        const h = hoursBetween(c.createdAt, c.resolvedAt);
        if (h !== null) resolutionHours.push(h);
      }
    }

    const avgResolutionHours = average(resolutionHours);
    const medianResolutionHours = median(resolutionHours);

    const resolvedCountForRate = resolved + verified;
    const reopenRate =
      resolvedCountForRate > 0 ? (reopened / resolvedCountForRate) * 100 : null;

    const ratings = filtered
      .map((c) => c.resolutionRating)
      .filter((r): r is number => typeof r === "number" && r >= 1 && r <= 5);
    const avgRating = average(ratings);
    const ratingCount = ratings.length;

    const stats: AnalyticsStats = {
      totalComplaints,
      openIssues,
      resolved,
      verified,
      reopened,
      averageResolutionHours: avgResolutionHours !== null ? Number(avgResolutionHours.toFixed(2)) : null,
      medianResolutionHours: medianResolutionHours !== null ? Number(medianResolutionHours.toFixed(2)) : null,
      reopenRate: reopenRate !== null ? Number(reopenRate.toFixed(2)) : null,
      averageRating: avgRating !== null ? Number(avgRating.toFixed(2)) : null,
      ratingCount,
    };

    const trends: ComplaintTrendDatum[] = [];
    if (filtered.length > 0) {
      const byDay = new Map<string, number>();
      for (const c of filtered) {
        const d = new Date(c.createdAt);
        if (isNaN(d.getTime())) continue;
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) || 0) + 1);
      }
      const sortedDays = Array.from(byDay.keys()).sort();
      for (const k of sortedDays) {
        trends.push({ label: formatDateLabel(k), value: byDay.get(k) || 0 });
      }
    }

    const hostelVsMessByDay = new Map<string, { hostel: number; mess: number }>();
    for (const c of filtered) {
      const d = new Date(c.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const entry = hostelVsMessByDay.get(key) || { hostel: 0, mess: 0 };
      if (c.area === "hostel") entry.hostel++;
      if (c.area === "mess") entry.mess++;
      hostelVsMessByDay.set(key, entry);
    }
    const hostelVsMessSorted = Array.from(hostelVsMessByDay.keys()).sort();
    const hostelVsMess: HostelVsMessDatum[] = hostelVsMessSorted.map((k) => ({
      label: formatDateLabel(k),
      ...(hostelVsMessByDay.get(k) || { hostel: 0, mess: 0 }),
    }));

    const byCategoryMap = new Map<string, number>();
    for (const c of filtered) {
      const key = c.category;
      byCategoryMap.set(key, (byCategoryMap.get(key) || 0) + 1);
    }
    const byCategory: CategoryBreakdownDatum[] = Array.from(byCategoryMap.entries())
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value);

    const byLocationMap = new Map<string, number>();
    for (const c of filtered) {
      const key = inferBlock(c.location);
      byLocationMap.set(key, (byLocationMap.get(key) || 0) + 1);
    }
    const byLocation: LocationBreakdownDatum[] = Array.from(byLocationMap.entries())
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value);

    const byPriorityMap = new Map<string, number>();
    for (const c of filtered) {
      const key = c.priority;
      byPriorityMap.set(key, (byPriorityMap.get(key) || 0) + 1);
    }
    const byPriority: PriorityBreakdownDatum[] = Array.from(byPriorityMap.entries())
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.label as keyof typeof order] - order[b.label as keyof typeof order];
      });

    const byStatusMap = new Map<string, number>();
    for (const c of filtered) {
      byStatusMap.set(c.status, (byStatusMap.get(c.status) || 0) + 1);
    }
    const byStatus: StatusBreakdownDatum[] = Array.from(byStatusMap.entries())
      .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v, status: k }))
      .sort((a, b) => b.value - a.value);

    const recurringMap = new Map<string, { count: number; last: string; area: "hostel" | "mess"; category: string; location: string }>();
    for (const c of filtered) {
      const key = `${c.area}|${c.category}|${normalizeLocation(inferBlock(c.location))}`;
      const entry = recurringMap.get(key) || {
        count: 0,
        last: c.createdAt,
        area: c.area,
        category: c.category,
        location: inferBlock(c.location),
      };
      entry.count++;
      const entryDate = new Date(entry.last);
      const curDate = new Date(c.createdAt);
      if (curDate > entryDate) entry.last = c.createdAt;
      recurringMap.set(key, entry);
    }
    const recurring: RecurringIssue[] = Array.from(recurringMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([key, v]) => ({
        key,
        title: `${v.category.replace(/_/g, " ")} — ${v.location}`,
        area: v.area,
        category: v.category,
        location: v.location,
        reports: v.count,
        lastReported: formatDateLabel(v.last),
      }))
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 10);

    const perfMap = new Map<string, { open: number; resolved: number; verified: number; reopened: number; resolutionHours: number[]; ratings: number[] }>();
    for (const c of filtered) {
      const key = `${c.area}|${c.category}`;
      const entry = perfMap.get(key) || {
        open: 0,
        resolved: 0,
        verified: 0,
        reopened: 0,
        resolutionHours: [],
        ratings: [],
      };
      if (c.status === "resolved") entry.resolved++;
      if (c.status === "verified") entry.verified++;
      if (c.status === "reopened") entry.reopened++;
      if (c.status !== "resolved" && c.status !== "verified") entry.open++;
      if ((c.status === "resolved" || c.status === "verified") && c.resolvedAt) {
        const h = hoursBetween(c.createdAt, c.resolvedAt);
        if (h !== null) entry.resolutionHours.push(h);
      }
      if (typeof c.resolutionRating === "number" && c.resolutionRating >= 1 && c.resolutionRating <= 5) {
        entry.ratings.push(c.resolutionRating);
      }
      perfMap.set(key, entry);
    }
    const servicePerformance: ServicePerformanceRow[] = Array.from(perfMap.entries())
      .map(([key, v]) => {
        const [service, category] = key.split("|") as ["hostel" | "mess", string];
        return {
          service,
          category,
          complaints: v.open + v.resolved + v.verified + v.reopened,
          open: v.open,
          resolved: v.resolved,
          verified: v.verified,
          reopened: v.reopened,
          avgResolutionHours: average(v.resolutionHours) !== null ? Number(average(v.resolutionHours)!.toFixed(2)) : null,
          avgRating: average(v.ratings) !== null ? Number(average(v.ratings)!.toFixed(2)) : null,
          ratingCount: v.ratings.length,
        };
      })
      .sort((a, b) => b.complaints - a.complaints);

    const resolutionOutcome: ResolutionOutcomeBreakdown = {
      awaitingVerification: filtered.filter((c) => c.status === "resolved").length,
      verified: filtered.filter((c) => c.status === "verified").length,
      reopened: filtered.filter((c) => c.status === "reopened").length,
    };

    const byWeekMap = new Map<string, number[]>();
    for (const c of filtered) {
      if ((c.status === "resolved" || c.status === "verified") && c.resolvedAt) {
        const h = hoursBetween(c.createdAt, c.resolvedAt);
        if (h !== null) {
          const d = new Date(c.resolvedAt);
          const key = d.toISOString().slice(0, 10);
          const arr = byWeekMap.get(key) || [];
          arr.push(h);
          byWeekMap.set(key, arr);
        }
      }
    }
    const resolutionTimeOverTime: ResolutionTimeOverTimeDatum[] = Array.from(byWeekMap.keys())
      .sort()
      .map((k) => {
        const arr = byWeekMap.get(k) || [];
        const avg = average(arr);
        return {
          label: formatDateLabel(k),
          avgHours: avg !== null ? Number(avg.toFixed(2)) : null,
        };
      });

    const aiByComplaint = new Map<string, { status: string; duplicate: boolean }>();
    for (const a of aiAnalyses) {
      aiByComplaint.set(a.complaint_id, { status: a.processing_status, duplicate: a.duplicate_candidate });
    }
    const aiMetrics: AiProcessingMetrics = {
      totalAnalyses: aiAnalyses.length,
      processed: aiAnalyses.filter((a) => a.processing_status === "completed").length,
      failed: aiAnalyses.filter((a) => a.processing_status === "failed").length,
      duplicates: aiAnalyses.filter((a) => a.duplicate_candidate).length,
    };

    const serviceHealth: ServiceHealthItem[] = servicePerformance.map((sp) => {
      const reopenRateSp = sp.resolved + sp.verified > 0 ? (sp.reopened / (sp.resolved + sp.verified)) * 100 : null;
      const complaintsScore = Math.max(0, 100 - Math.min(sp.complaints, 100));
      const resScore = sp.avgResolutionHours !== null ? Math.max(0, 100 - Math.min(sp.avgResolutionHours * 2, 100)) : 70;
      const reopenScore = reopenRateSp !== null ? Math.max(0, 100 - Math.min(reopenRateSp * 5, 100)) : 80;
      const satScore = sp.avgRating !== null ? (sp.avgRating / 5) * 100 : 70;
      const score = Math.round((complaintsScore * 0.2 + resScore * 0.3 + reopenScore * 0.3 + satScore * 0.2) * 0.8 + 20);
      return {
        key: `${sp.service}|${sp.category}`,
        service: sp.service,
        category: sp.category,
        label: `${sp.category.replace(/_/g, " ")} (${sp.service})`,
        status: getHealthStatus(score),
        score,
        complaints: sp.complaints,
        reopenRate: reopenRateSp !== null ? Number(reopenRateSp.toFixed(2)) : null,
        avgResolutionHours: sp.avgResolutionHours,
        avgRating: sp.avgRating,
      };
    });

    return {
      stats,
      trends,
      hostelVsMess,
      byCategory,
      byLocation,
      byPriority,
      byStatus,
      recurring,
      servicePerformance,
      resolutionOutcome,
      resolutionTimeOverTime,
      aiMetrics,
      serviceHealth,
      dateRangeLabel: range.label,
      totalFiltered: totalComplaints,
    };
  },
);
