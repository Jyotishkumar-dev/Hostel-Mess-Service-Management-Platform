"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";
import { runAiAnalysis } from "@/lib/complaints/ai";

import type { AdminActionState } from "@/lib/admin/state";

const NOT_CONFIGURED =
  "Storage is not connected yet. Add your Supabase keys to .env.local.";

/**
 * Re-runs the AI analysis for a single complaint. Admin-only: the RLS policy
 * on `complaint_ai_analysis` allows the caller to upsert only their own or
 * an admin's analysis rows, so a forged request is rejected at the database
 * level. An admin can retry after a previous failure or update an outdated
 * suggestion.
 */
export async function triggerAiAnalysisAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  await requireRole("admin");

  const complaintId = formData.get("complaintId")?.toString();
  if (!complaintId) {
    return { status: "error", message: "No issue selected." };
  }

  try {
    // Upsert the row to "processing" so the UI can show the loading state
    // before the potentially slow Gemini call.
    const { error: statusError } = await supabase
      .from("complaint_ai_analysis")
      .upsert({
        complaint_id: complaintId,
        ai_processing_status: "processing",
      })
      .select("complaint_id")
      .single();

    if (statusError) {
      console.error("[admin] ai status update failed:", statusError.message);
    }

    // Fire the actual analysis. This is awaited because the admin explicitly
    // asked for it — the loading UI is shown until it completes.
    const result = await runAiAnalysis(supabase, complaintId);

    revalidatePath(`/admin/issues/${complaintId}`);
    revalidatePath("/admin/issues");

    if (!result.ok) {
      return {
        status: "error",
        message: result.error ?? "AI analysis failed.",
      };
    }

    return {
      status: "success",
      message: "AI analysis completed successfully.",
    };
  } catch (error) {
    console.error("[admin] trigger ai analysis failed:", error);
    return {
      status: "error",
      message: "AI analysis failed. Please try again.",
    };
  }
}
