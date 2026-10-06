import type { ComplaintEventRow, Profile } from "@/types/auth";
import { initialsOf, formatDateTime } from "@/lib/format";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ServiceArea,
  StaffMember,
  StatusChange,
  AiAnalysis,
  VerificationStatus,
} from "@/types/complaint";

/**
 * Converts database rows into the camelCase domain objects the UI renders.
 *
 * This is the only place that knows Postgres uses snake_case while the rest of
 * the app uses camelCase, and the only place raw `timestamptz` strings become
 * display strings. Keeping it in one file means a column rename is a one-line
 * change instead of a hunt through every component.
 */

/** The joined shape a complaint select returns. */
export type ComplaintWithStaff = ComplaintDbRow & {
  assigned_staff: Pick<Profile, "id" | "full_name" | "role"> | null;
  /** Joined profile of the reporting student (NULL where RLS hides the row). */
  student: Pick<Profile, "full_name"> | null;
  /** Joined profile of whoever marked the complaint resolved. */
  resolved_by_profile: Pick<Profile, "id" | "full_name" | "role"> | null;
};

type ComplaintDbRow = {
  id: string;
  reference: string;
  user_id: string;
  service_type: string;
  category: string;
  title: string;
  description: string;
  location: string;
  image_path: string | null;
  status: string;
  priority: string;
  assigned_staff_id: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_image_path: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * The profiles table has no `team` column, so the team shown on a detail page is
 * derived from the person's role. Phase 5 replaces this with a real staff
 * directory.
 */
function staffFrom(
  staff: Pick<Profile, "id" | "full_name" | "role"> | null,
): StaffMember | null {
  if (!staff) return null;

  return {
    id: staff.id,
    name: staff.full_name,
    role: staff.role,
    team: staff.role === "staff" ? "Support team" : "Administration",
    initials: initialsOf(staff.full_name),
  };
}

export function toStatusChange(event: ComplaintEventRow): StatusChange {
  return {
    status: event.status as ComplaintStatus,
    at: formatDateTime(event.created_at),
    note: event.note,
    actorName: event.actor_name,
  };
}

export function toComplaint(
  row: ComplaintWithStaff,
  options: {
    /** The reporting student's name. Staff/admin can't read other profiles
     * through RLS, so this is only passed from the student read path; when it
     * is absent the detail page omits the "Reported by" line entirely. */
    studentName?: string;
    events: ComplaintEventRow[];
    imageUrl?: string | null;
    resolutionImageUrl?: string | null;
    aiAnalysis?: AiAnalysis | null;
  },
): Complaint {
  // Sort on the raw ISO timestamp, not the formatted string: "16 Mar, 9:35 am"
  // does not sort lexicographically across month boundaries.
  const timeline = [...options.events]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(toStatusChange);

  const studentName =
    options.studentName ?? row.student?.full_name ?? "Student";

  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    status: row.status as ComplaintStatus,
    priority: row.priority as ComplaintPriority,
    area: row.service_type as ServiceArea,
    category: row.category as ComplaintCategory,
    location: row.location,
    studentName,
    studentInitials: initialsOf(studentName),
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    assignedStaff: staffFrom(row.assigned_staff),
    resolutionNote: row.resolution_note ?? undefined,
    resolvedBy: staffFrom(row.resolved_by_profile),
    resolvedAt: formatDateTime(row.resolved_at ?? null),
    imageUrl: options.imageUrl ?? null,
    resolutionImageUrl: options.resolutionImageUrl ?? null,
    aiAnalysis: options.aiAnalysis ?? null,
    verificationStatus: (row as ComplaintWithStaff & { verification_status?: string }).verification_status as VerificationStatus ?? "pending",
    verifiedAt: (row as ComplaintWithStaff & { verified_at?: string | null }).verified_at ?? null,
    verifiedBy: (row as ComplaintWithStaff & { verified_by?: string | null }).verified_by
      ? {
          id: (row as ComplaintWithStaff & { verified_by: string }).verified_by,
          name: "",
          role: "student",
          team: "",
          initials: "",
        }
      : null,
    reopenReason: (row as ComplaintWithStaff & { reopen_reason?: string | null }).reopen_reason ?? null,
    reopenedAt: (row as ComplaintWithStaff & { reopened_at?: string | null }).reopened_at ?? null,
    reopenedBy: (row as ComplaintWithStaff & { reopened_by?: string | null }).reopened_by
      ? {
          id: (row as ComplaintWithStaff & { reopened_by: string }).reopened_by,
          name: "",
          role: "student",
          team: "",
          initials: "",
        }
      : null,
    resolutionRating: (row as ComplaintWithStaff & { resolution_rating?: number | null }).resolution_rating ?? null,
    resolutionFeedback: (row as ComplaintWithStaff & { resolution_feedback?: string | null }).resolution_feedback ?? null,
    timeline,
  };
}