/**
 * Core domain types.
 *
 * These mirror the shape of the PostgreSQL tables that will be created in a
 * later phase. They are plain TypeScript only — no runtime behaviour — so they
 * can be imported from both server and client components.
 */

export const COMPLAINT_STATUSES = [
  "reported",
  "assigned",
  "in_progress",
  "resolved",
  "reopened",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

/** Which side of campus an issue belongs to. */
export const SERVICE_AREAS = ["hostel", "mess"] as const;

export type ServiceArea = (typeof SERVICE_AREAS)[number];

export const COMPLAINT_CATEGORIES = [
  "water",
  "electricity",
  "cleanliness",
  "food_quality",
  "food_hygiene",
  "maintenance",
  "security",
  "internet",
  "other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

/** A member of hostel or mess support staff. */
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  team: string;
  initials: string;
}

export interface StatusChange {
  status: ComplaintStatus;
  /** Human readable, mock timestamp. */
  at: string;
  note: string;
  actorName: string;
}

export interface Complaint {
  id: string;
  /** Short human reference, e.g. "CMP-2417". */
  reference: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  area: ServiceArea;
  category: ComplaintCategory;
  /** Free-text location, e.g. "Block C, Room 314". */
  location: string;
  studentName: string;
  studentInitials: string;
  createdAt: string;
  updatedAt: string;
  assignedStaff: StaffMember | null;
  /** Present once work has started. */
  resolutionNote?: string;
  /** Mock stage markers shown on the detail page timeline. */
  timeline: StatusChange[];
}
