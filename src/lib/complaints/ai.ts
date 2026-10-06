import "server-only";

import { analyzeComplaint } from "@/lib/ai/gemini";
import type {
  AiAnalysis,
  ComplaintCategory,
} from "@/types/complaint";
import type { ComplaintAiAnalysisRow, ComplaintRow } from "@/types/auth";
import type { AiProcessingStatus } from "@/types/complaint";

export type TypedSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof import("@/lib/supabase").createTypedServerClient>>
>;

/** Statuses a complaint can be in for duplicate matching (i.e. not closed). */
const OPEN_STATUSES = ["reported", "assigned", "in_progress", "reopened"] as const;

/** Maps an `ai_processing_status` row to the friendly domain type. */
export function mapAiAnalysis(row: ComplaintAiAnalysisRow): AiAnalysis {
  return {
    complaintId: row.complaint_id,
    category: row.ai_category,
    priority: row.ai_priority,
    summary: row.ai_summary,
    department: row.ai_department,
    duplicateCandidate: row.ai_duplicate_candidate ?? false,
    duplicateComplaintId: row.ai_duplicate_complaint_id,
    duplicateReason: row.ai_duplicate_reason,
    confidence: row.ai_confidence,
    processingStatus:
      (row.ai_processing_status as AiProcessingStatus) ?? "failed",
    processedAt: row.ai_processed_at,
    confirmed: row.ai_confirmed ?? false,
    reviewedBy: row.ai_reviewed_by,
    reviewedAt: row.ai_reviewed_at,
  };
}

/** Minimal, PII-safe projection of a complaint for duplicate matching. */
interface CandidateRow {
  id: string;
  title: string;
  category: string;
  service_type: string;
  location: string;
  status: string;
}

/**
 * Runs the AI analysis for a single complaint and stores the result.
 *
 * The `supabase` client is the caller's session-scoped client, so every read
 * and write is RLS-bounded: a student only inspects and stores their own
 * complaint's analysis, while an admin (e.g. via the Retry button) sees and
 * writes the full picture. This is what makes the same routine correct for both
 * the post-submit trigger and the admin review.
 */
export async function runAiAnalysis(
  supabase: TypedSupabaseClient,
  complaintId: string,
): Promise<{ ok: boolean; status: AiProcessingStatus; error?: string }> {
  // 1. Load the complaint being analysed.
  const { data: complaint, error: loadError } = await supabase
    .from("complaints")
    .select("service_type, category, title, description, location")
    .eq("id", complaintId)
    .maybeSingle();

  if (loadError || !complaint) {
    return markFailed(supabase, complaintId, "Could not load the complaint.");
  }

  const row: ComplaintRow = complaint as ComplaintRow;

  // 2. Load recent open complaints in the same service area for duplicate
  //    detection. RLS naturally limits what the caller can see.
  const { data: candidates } = await supabase
    .from("complaints")
    .select("id, title, category, service_type, location, status")
    .neq("id", complaintId)
    .in(
      "status",
      OPEN_STATUSES as unknown as readonly (
        | "reported"
        | "assigned"
        | "in_progress"
        | "reopened"
      )[],
    )
    .eq("service_type", row.service_type)
    .order("created_at", { ascending: false })
    .limit(15);

  const candidateRows = (candidates ?? []) as CandidateRow[];

  // 3. Ask Gemini.
  const result = await analyzeComplaint({
    serviceType: row.service_type,
    category: row.category ?? null,
    title: row.title,
    description: row.description,
    location: row.location,
    candidates: candidateRows.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category as ComplaintCategory,
      area: c.service_type,
      location: c.location,
      status: c.status,
    })),
  });

  if (!result.ok) {
    return markFailed(supabase, complaintId, result.error);
  }

  const suggestion = result.data;
  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("complaint_ai_analysis")
    .upsert({
      complaint_id: complaintId,
      ai_category: suggestion.category,
      ai_priority: suggestion.priority,
      ai_summary: suggestion.summary,
      ai_department: suggestion.department,
      ai_duplicate_candidate: suggestion.duplicate_candidate,
      ai_duplicate_complaint_id: suggestion.duplicate_complaint_id ?? null,
      ai_duplicate_reason: suggestion.duplicate_reason ?? null,
      ai_confidence: suggestion.confidence,
      ai_processing_status: "completed",
      ai_processed_at: now,
    })
    .select("complaint_id")
    .single();

  if (upsertError) {
    console.error("[ai] failed to persist analysis:", upsertError.message);
    return markFailed(supabase, complaintId, "Could not save the analysis.");
  }

  return { ok: true, status: "completed" };
}

/** Persists a failed analysis so the UI can surface a retry option. */
async function markFailed(
  supabase: TypedSupabaseClient,
  complaintId: string,
  reason: string,
): Promise<{ ok: boolean; status: AiProcessingStatus; error: string }> {
  const now = new Date().toISOString();

  const { error } = await supabase.from("complaint_ai_analysis").upsert({
    complaint_id: complaintId,
    ai_processing_status: "failed",
    ai_processed_at: now,
  });

  if (error) {
    console.error("[ai] could not even record failure:", error.message);
  }

  return { ok: false, status: "failed", error: reason };
}
