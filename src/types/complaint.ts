/**
 * Core domain types.
 *
 * These mirror the shape of the PostgreSQL tables created in Phase 3. They are
 * plain TypeScript only — no runtime behaviour — so they can be imported from
 * both server and client components.
 */

export const COMPLAINT_STATUSES = [
  "reported",
  "assigned",
  "in_progress",
  "resolved",
  "reopened",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

/** Lifecycle states the AI processing pipeline can be in. */
export const AI_PROCESSING_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type AiProcessingStatus = (typeof AI_PROCESSING_STATUSES)[number];

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

/**
 * Categories are split per service area, because the issues a student reports
 * in a hostel and in a dining hall have nothing in common.
 *
 * `other` is deliberately shared: it is the one category that makes sense on
 * both sides, so a student is never forced into a wrong bucket just because
 * their issue did not fit.
 */
export const HOSTEL_CATEGORIES = [
  "water",
  "electricity",
  "internet",
  "cleaning",
  "room_maintenance",
  "furniture",
  "washroom",
  "security",
  "laundry",
  "common_area",
  "other",
] as const;

export const MESS_CATEGORIES = [
  "food_quality",
  "taste",
  "hygiene",
  "quantity",
  "menu",
  "timing",
  "variety",
  "cleanliness",
  "staff_service",
  "other",
] as const;

/** Every category the database accepts, for type-safe iteration. */
export const COMPLAINT_CATEGORIES = [
  ...new Set([...HOSTEL_CATEGORIES, ...MESS_CATEGORIES]),
] as readonly ComplaintCategory[];

export type HostelCategory = (typeof HOSTEL_CATEGORIES)[number];
export type MessCategory = (typeof MESS_CATEGORIES)[number];
export type ComplaintCategory = HostelCategory | MessCategory;

/** The categories valid for one service area. */
export function categoriesForArea(area: ServiceArea): readonly ComplaintCategory[] {
  return area === "hostel" ? HOSTEL_CATEGORIES : MESS_CATEGORIES;
}

/** True when `category` is a valid choice for `area`. */
export function isCategoryForArea(
  area: ServiceArea,
  category: ComplaintCategory,
): boolean {
  return (categoriesForArea(area) as readonly string[]).includes(category);
}

/**
 * Suggested location values shown under the location input, per service area.
 * These are hints to help students write a useful location — the field itself
 * stays free text, because every campus names its spaces differently.
 */
export const AREA_LOCATION_SUGGESTIONS: Record<ServiceArea, readonly string[]> = {
  hostel: [
    "Block A",
    "Block B",
    "Block C",
    "Common room",
    "Reading room",
    "Ground floor",
    "First floor",
    "Second floor",
    "Third floor",
    "Washroom",
    "Corridor",
    "Gate",
  ],
  mess: [
    "Main Mess",
    "Block Mess",
    "Dining Hall",
    "Kitchen",
    "Serving Counter",
    "Common Mess",
    "Other",
  ],
};

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
  /** Pre-formatted for display, e.g. "16 Mar, 9:35 AM". */
  at: string;
  note: string;
  actorName: string;
}

export interface Complaint {
  id: string;
  /** Short human reference, e.g. "CMP-1041". */
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
  /**
   * Staff member who marked the complaint resolved, read from the
   * `resolved_by` profile join. Null until the issue is resolved.
   */
  resolvedBy: StaffMember | null;
  /** When the complaint was moved to `resolved`, formatted for display. */
  resolvedAt: string | null;
  /**
   * Short-lived signed URL for the optional resolution photo, resolved
   * server-side. Null when the complaint has not been resolved or the file
   * could not be signed.
   */
  resolutionImageUrl: string | null;
  /**
   * Short-lived signed URL for the uploaded photo, resolved server-side.
   * Null when the complaint has no photo or the file could not be signed.
   */
  imageUrl: string | null;
  /** Real status history, read from `complaint_events`. */
  timeline: StatusChange[];
}

/**
 * AI analysis stored in `complaint_ai_analysis`, mapped to friendly names.
 *
 * Suggestion fields are advisory; the admin-confirmed values still live on the
 * `Complaint` itself (`category`, `priority`). This object is only surfaced to
 * admins/staff, never to the student who filed the report.
 */
export interface AiAnalysis {
  complaintId: string;
  category: string | null;
  priority: ComplaintPriority | null;
  summary: string | null;
  department: string | null;
  duplicateCandidate: boolean;
  duplicateComplaintId: string | null;
  duplicateReason: string | null;
  confidence: number | null;
  processingStatus: AiProcessingStatus;
  processedAt: string | null;
  confirmed: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
}