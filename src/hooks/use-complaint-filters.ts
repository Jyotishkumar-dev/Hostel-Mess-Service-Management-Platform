"use client";

import { useMemo, useState } from "react";
import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  ServiceArea,
} from "@/types/complaint";

/**
 * Filtering and sorting for a complaint list.
 *
 * Shared by the student, admin and staff complaint screens so the three
 * behave identically. State is deliberately local — when these lists come from
 * Supabase this logic moves into a query and the rest of the UI is unchanged.
 */

export type StatusFilter = ComplaintStatus | "all";
export type PriorityFilter = ComplaintPriority | "all";
export type AreaFilter = ServiceArea | "all";
export type SortKey = "recent" | "priority" | "status";

const PRIORITY_WEIGHT: Record<ComplaintPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_WEIGHT: Record<ComplaintStatus, number> = {
  reopened: 0,
  reported: 1,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
};

export interface ComplaintFilters {
  status: StatusFilter;
  priority: PriorityFilter;
  area: AreaFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: ComplaintFilters = {
  status: "all",
  priority: "all",
  area: "all",
  sort: "recent",
};

export function useComplaintFilters(complaints: Complaint[]) {
  const [filters, setFilters] = useState<ComplaintFilters>(DEFAULT_FILTERS);

  const visible = useMemo(() => {
    const filtered = complaints.filter((complaint) => {
      if (filters.status !== "all" && complaint.status !== filters.status)
        return false;
      if (
        filters.priority !== "all" &&
        complaint.priority !== filters.priority
      )
        return false;
      if (filters.area !== "all" && complaint.area !== filters.area) return false;
      return true;
    });

    // The source list is already newest first, so "recent" needs no sorting.
    if (filters.sort === "recent") return filtered;

    if (filters.sort === "priority") {
      return [...filtered].sort(
        (a, b) =>
          PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
          a.reference.localeCompare(b.reference),
      );
    }

    return [...filtered].sort(
      (a, b) =>
        STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] ||
        a.reference.localeCompare(b.reference),
    );
  }, [complaints, filters]);

  const isFiltered = filters.status !== "all"
    || filters.priority !== "all"
    || filters.area !== "all";

  return {
    filters,
    setFilters,
    visible,
    isFiltered,
    reset: () => setFilters(DEFAULT_FILTERS),
  };
}
