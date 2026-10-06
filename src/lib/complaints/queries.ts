import "server-only";

import { cache } from "react";
import { createTypedServerClient } from "@/lib/supabase";
import { requireUser, requireRole } from "@/lib/auth/session";
import { toComplaint, type ComplaintWithStaff } from "@/lib/complaints/mapper";
import { IMAGE_BUCKET, IMAGE_URL_TTL_SECONDS } from "@/lib/complaints/constants";
import type { ComplaintEventRow } from "@/types/auth";
import type { Complaint } from "@/types/complaint";
import type { ComplaintAiAnalysisRow } from "@/types/auth";
import type { AiAnalysis } from "@/types/complaint";
import { mapAiAnalysis } from "@/lib/complaints/ai";
import { mapAiAnalysis } from "@/lib/complaints/ai";

/**
 * Read side of the complaint feature.
 *
 * Every function here returns `{ ok, data }` instead of throwing. A database
 * error, a signed-out session and "you have no complaints" are all normal
 * outcomes that the UI has to render differently, and a thrown error would send
 * every one of them to the same error boundary.
 */

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const NOT_CONFIGURED =
  "Feedback storage is not connected yet. Add your Supabase keys to .env.local to enable it.";

/** Columns selected for the staff/admin detail and worklist. */
export const STAFF_COMPLAINT_SELECT =
  "id, reference, user_id, service_type, category, title, description, location, image_path, status, priority, assigned_staff_id, resolution_note, resolved_by, resolved_at, resolution_image_path, created_at, updated_at, assigned_staff:assigned_staff_id ( id, full_name, role ), resolved_by_profile:resolved_by ( id, full_name, role ), student:user_id ( full_name )";

/** Columns selected for every student complaint read. */
const COMPLAINT_SELECT =
  "id, reference, user_id, service_type, category, title, description, location, image_path, status, priority, assigned_staff_id, resolution_note, created_at, updated_at, assigned_staff:assigned_staff_id ( id, full_name, role )";

/**
 * Loads the signed-in student's complaints, newest first.
 *
 * `requireUser()` throws a redirect for an anonymous visitor, so this always
 * runs as somebody. The RLS policy `complaints_select_own` does the real
 * filtering — this query adds an `eq("user_id", ...)` purely so Postgres can use
 * the composite index.
 */
export const listMyComplaints = cache(async (): Promise<Result<Complaint[]>> => {
  const user = await requireUser();
  const supabase = await createTypedServerClient();

  if (!supabase) return { ok: false, error: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("complaints")
    .select(COMPLAINT_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // The raw message can expose table and column names, so it is logged
    // server-side and never returned to the browser.
    console.error("[complaints] list failed:", error.message);
    return {
      ok: false,
      error: "We could not load your feedback right now. Please try again.",
    };
  }

  const rows = (data ?? []) as ComplaintWithStaff[];
  if (rows.length === 0) return { ok: true, data: [] };

  // One extra query for every timeline, rather than one query per complaint.
  const events = await loadEvents(supabase, rows.map((row) => row.id));
  const signed = await signImages(supabase, rows);

  return {
    ok: true,
    data: rows.map((row) =>
      toComplaint(row, {
        studentName: user.fullName,
        events: events[row.id] ?? [],
        imageUrl: signed.get(row.id) ?? null,
      }),
    ),
  };
});

/**
 * Loads a single complaint owned by the signed-in student.
 *
 * Returns `null` for a missing id *and* for somebody else's complaint. The two
 * are deliberately indistinguishable: telling them apart would confirm that an
 * id exists, which is exactly the information Test 7 must not leak.
 */
export const getMyComplaint = cache(
  async (id: string): Promise<Result<Complaint | null>> => {
    const user = await requireUser();
    const supabase = await createTypedServerClient();

    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    const { data, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[complaints] get failed:", error.message);
      return {
        ok: false,
        error: "We could not open that complaint right now. Please try again.",
      };
    }

    // RLS already removed rows that are not the caller's; this is belt and braces
    // against ever rendering another student's report.
    if (!data || data.user_id !== user.id) {
      return { ok: true, data: null };
    }

    const events = await loadEvents(supabase, [id]);
    const signed = await signImages(supabase, [data as ComplaintWithStaff]);

    return {
      ok: true,
      data: toComplaint(data as ComplaintWithStaff, {
        studentName: user.fullName,
        events: events[id] ?? [],
        imageUrl: signed.get(id) ?? null,
      }),
    };
  },
);

/** Counts for the student dashboard, derived from the same rows the page shows. */
export type ComplaintStats = {
  total: number;
  reported: number;
  inProgress: number;
  resolved: number;
};

export function summariseComplaints(complaints: Complaint[]): ComplaintStats {
  return {
    total: complaints.length,
    reported: complaints.filter((c) => c.status === "reported").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };
}

async function loadEvents(
  supabase: NonNullable<Awaited<ReturnType<typeof createTypedServerClient>>>,
  complaintIds: string[],
): Promise<Record<string, ComplaintEventRow[]>> {
  const grouped: Record<string, ComplaintEventRow[]> = {};

  if (complaintIds.length === 0) return grouped;

  const { data, error } = await supabase
    .from("complaint_events")
    .select("id, complaint_id, status, note, actor_id, actor_name, created_at")
    .in("complaint_id", complaintIds);

  if (error) {
    // A missing timeline degrades the page slightly; it must not break it.
    console.error("[complaints] events failed:", error.message);
    return grouped;
  }

  for (const event of (data ?? []) as ComplaintEventRow[]) {
    (grouped[event.complaint_id] ??= []).push(event);
  }

  return grouped;
}

export { loadEvents };

/**
 * Mints short-lived signed URLs for complaint photos, keyed by complaint id.
 *
 * The bucket is private, so there is no public URL to render. A signed URL is
 * granted per object and expires quickly, which is what stops a leaked link
 * from becoming a permanent window into the storage bucket.
 */
async function signImages(
  supabase: NonNullable<Awaited<ReturnType<typeof createTypedServerClient>>>,
  rows: ComplaintWithStaff[],
): Promise<Map<string, string>> {
  const byId = new Map<string, string>();

  const withPhotos = rows.filter(
    (row): row is ComplaintWithStaff & { image_path: string } =>
      row.image_path !== null,
  );

  if (withPhotos.length === 0) return byId;

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(
      withPhotos.map((row) => row.image_path),
      IMAGE_URL_TTL_SECONDS,
    );

  if (error) {
    // A photo that cannot be signed must not take the page down with it.
    console.error("[complaints] signing images failed:", error.message);
    return byId;
  }

  // createSignedUrls answers in request order, so index alignment is safe here.
  data?.forEach((entry, index) => {
    const row = withPhotos[index];
    if (row && entry.signedUrl) byId.set(row.id, entry.signedUrl);
  });

  return byId;
}

export { signImages };

/**
 * Same as `signImages` but for the optional resolution photo stored under the
 * `resolution/` namespace. Only signed for staff/admin, who the storage policies
 * allow to read their own resolution evidence.
 */
async function signResolutionImages(
  supabase: NonNullable<Awaited<ReturnType<typeof createTypedServerClient>>>,
  rows: ComplaintWithStaff[],
): Promise<Map<string, string>> {
  const byId = new Map<string, string>();

  const withPhotos = rows.filter(
    (row): row is ComplaintWithStaff & { resolution_image_path: string } =>
      row.resolution_image_path !== null,
  );

  if (withPhotos.length === 0) return byId;

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(
      withPhotos.map((row) => row.resolution_image_path),
      IMAGE_URL_TTL_SECONDS,
    );

  if (error) {
    console.error("[complaints] signing resolution images failed:", error.message);
    return byId;
  }

  data?.forEach((entry, index) => {
    const row = withPhotos[index];
    if (row && entry.signedUrl) byId.set(row.id, entry.signedUrl);
  });

  return byId;
}

export { signResolutionImages };

/**
 * Loads the complaints assigned to the signed-in staff member.
 *
 * `requireRole("staff")` throws a redirect for anyone else, and the
 * `complaints_select_staff` RLS policy can only ever return rows that are
 * assigned to the caller — so a staff member physically cannot read another
 * team's issues here, no matter what the client asks for.
 *
 * The list is newest-first and left unsorted by priority: the shared
 * `useComplaintFilters` hook lets the page sort by priority when required.
 */
export const listStaffComplaints = cache(async (): Promise<Result<Complaint[]>> => {
  const user = await requireRole("staff");
  const supabase = await createTypedServerClient();

  if (!supabase) return { ok: false, error: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("complaints")
    .select(STAFF_COMPLAINT_SELECT)
    .eq("assigned_staff_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[staff] list failed:", error.message);
    return {
      ok: false,
      error: "We could not load your assigned issues right now. Please try again.",
    };
  }

  return mapComplaintRows(supabase, (data ?? []) as ComplaintWithStaff[]);
});

/**
 * Loads a single complaint the signed-in staff member is allowed to see.
 *
 * Returns `null` for a missing id *and* for an issue owned by another team —
 * the two are indistinguishable, so one staff member cannot enumerate another
 * team's complaint ids.
 */
export const getStaffComplaint = cache(
  async (id: string): Promise<Result<Complaint | null>> => {
    await requireRole("staff");
    const supabase = await createTypedServerClient();

    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    const { data, error } = await supabase
      .from("complaints")
      .select(STAFF_COMPLAINT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[staff] get failed:", error.message);
      return {
        ok: false,
        error: "We could not open that issue right now. Please try again.",
      };
    }

    if (!data) return { ok: true, data: null };

    const mapped = await mapComplaintRows(supabase, [data as ComplaintWithStaff]);

    if (!mapped.ok) return mapped;
    return { ok: true, data: mapped.data[0] ?? null };
  },
);

/**
 * Shared row -> domain mapper for the staff/admin read path. Joins the timeline
 * and mints signed URLs for both the student evidence photo and the optional
 * resolution photo.
 */
export async function mapComplaintRows(
  supabase: NonNullable<Awaited<ReturnType<typeof createTypedServerClient>>>,
  rows: ComplaintWithStaff[],
): Promise<Result<Complaint[]>> {
  if (rows.length === 0) return { ok: true, data: [] };

  const events = await loadEvents(supabase, rows.map((row) => row.id));
  const images = await signImages(supabase, rows);
  const resolutionImages = await signResolutionImages(supabase, rows);

  return {
    ok: true,
    data: rows.map((row) =>
      toComplaint(row, {
        events: events[row.id] ?? [],
        imageUrl: images.get(row.id) ?? null,
        resolutionImageUrl: resolutionImages.get(row.id) ?? null,
      }),
    ),
  };
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Loads the AI analysis for a single complaint.
 *
 * Returns `null` when no analysis row exists yet (e.g. the AI has not run or
 * the complaint predates Phase 6). The caller's role determines what RLS
 * allows them to read.
 */
export const getAiAnalysis = cache(
  async (complaintId: string): Promise<Result<AiAnalysis | null>> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };

    const { data, error } = await supabase
      .from("complaint_ai_analysis")
      .select("*")
      .eq("complaint_id", complaintId)
      .maybeSingle();

    if (error) {
      console.error("[ai] get failed:", error.message);
      return {
        ok: false,
        error: "We could not load the AI analysis right now.",
      };
    }

    if (!data) return { ok: true, data: null };

    return {
      ok: true,
      data: mapAiAnalysis(data as ComplaintAiAnalysisRow),
    };
  },
);
