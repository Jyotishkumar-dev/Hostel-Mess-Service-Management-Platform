import type { LucideIcon } from "lucide-react";
import {
  AlertOctagon,
  CheckCircle2,
  CircleDashed,
  CircleDotDashed,
  RotateCcw,
} from "lucide-react";
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ServiceArea,
} from "@/types/complaint";
import { categoriesForArea } from "@/types/complaint";

/**
 * The single source of truth for how a status or priority looks.
 *
 * Components must never invent their own colours for these values — they read
 * from here so that "In Progress" is rendered identically on the student
 * dashboard, the admin table and the staff detail page.
 */

export interface StatusStyle {
  label: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_STYLES: Record<ComplaintStatus, StatusStyle> = {
  reported: {
    label: "Reported",
    description: "Submitted and waiting to be reviewed by the admin.",
    icon: CircleDashed,
    badgeClass:
      "bg-status-reported-bg text-status-reported-fg ring-status-reported/25",
    dotClass: "bg-status-reported",
  },
  assigned: {
    label: "Assigned",
    description: "Handed to a staff member who has not started yet.",
    icon: CircleDotDashed,
    badgeClass:
      "bg-status-assigned-bg text-status-assigned-fg ring-status-assigned/25",
    dotClass: "bg-status-assigned",
  },
  in_progress: {
    label: "In Progress",
    description: "Work has started on campus.",
    icon: AlertOctagon,
    badgeClass:
      "bg-status-in-progress-bg text-status-in-progress-fg ring-status-in-progress/30",
    dotClass: "bg-status-in-progress",
  },
  resolved: {
    label: "Resolved",
    description: "Marked complete and awaiting student verification.",
    icon: CheckCircle2,
    badgeClass:
      "bg-status-resolved-bg text-status-resolved-fg ring-status-resolved/25",
    dotClass: "bg-status-resolved",
  },
  reopened: {
    label: "Reopened",
    description: "The student reported that the fix did not hold.",
    icon: RotateCcw,
    badgeClass:
      "bg-status-reopened-bg text-status-reopened-fg ring-status-reopened/25",
    dotClass: "bg-status-reopened",
  },
};

export interface PriorityStyle {
  label: string;
  /** Left border colour used inside list rows. */
  accentClass: string;
  badgeClass: string;
}

export const PRIORITY_STYLES: Record<ComplaintPriority, PriorityStyle> = {
  critical: {
    label: "Critical",
    accentClass: "bg-priority-critical",
    badgeClass: "bg-priority-critical-bg text-priority-critical-fg ring-priority-critical/25",
  },
  high: {
    label: "High",
    accentClass: "bg-priority-high",
    badgeClass: "bg-priority-high-bg text-priority-high-fg ring-priority-high/25",
  },
  medium: {
    label: "Medium",
    accentClass: "bg-priority-medium",
    badgeClass: "bg-priority-medium-bg text-priority-medium-fg ring-priority-medium/25",
  },
  low: {
    label: "Low",
    accentClass: "bg-priority-low",
    badgeClass: "bg-priority-low-bg text-priority-low-fg ring-priority-low/25",
  },
};

export const AREA_LABELS: Record<ServiceArea, string> = {
  hostel: "Hostel",
  mess: "Mess",
};

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  // hostel
  water: "Water supply",
  electricity: "Electricity",
  internet: "Wi-Fi",
  cleaning: "Cleaning",
  room_maintenance: "Room maintenance",
  furniture: "Furniture",
  washroom: "Washroom",
  security: "Security",
  laundry: "Laundry",
  common_area: "Common area",
  // mess
  food_quality: "Food quality",
  taste: "Taste",
  hygiene: "Hygiene",
  quantity: "Quantity",
  menu: "Menu",
  timing: "Meal timing",
  variety: "Variety",
  cleanliness: "Cleanliness",
  staff_service: "Staff service",
  // either
  other: "Other",
};

/**
 * Short helper used by the category picker and any filter that is scoped to a
 * single service area.
 */
export function categoryOptionsFor(area: ServiceArea) {
  return categoriesForArea(area).map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
  }));
}

/**
 * The happy path a complaint travels through.
 *
 * `reopened` is intentionally absent: it is not a forward step but a branch back
 * into the flow, so it renders as an extra timeline entry rather than a stage.
 */
export const STATUS_ORDER: ComplaintStatus[] = [
  "reported",
  "assigned",
  "in_progress",
  "resolved",
];

export function statusStyle(status: ComplaintStatus): StatusStyle {
  return STATUS_STYLES[status];
}

export function priorityStyle(priority: ComplaintPriority): PriorityStyle {
  return PRIORITY_STYLES[priority];
}
