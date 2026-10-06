"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";

import type { AdminActionState } from "@/lib/admin/state";

const NOT_CONFIGURED =
  "Storage is not connected yet. Add your Supabase keys to .env.local.";

/**
 * Routes a complaint to a staff member via the `assign_complaint` SECURITY
 * DEFINER function. Admin-only: the function re-checks `is_admin`, so a forged
 * staffId or a non-admin caller is rejected at the database level.
 */
export async function assignComplaintAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  await requireRole("admin");

  const complaintId = formData.get("complaintId")?.toString();
  const staffId = formData.get("staffId")?.toString();

  if (!complaintId || !staffId) {
    return { status: "error", message: "Select an issue and a staff member." };
  }

  try {
    const { data: ok, error } = await supabase.rpc("assign_complaint", {
      p_complaint_id: complaintId,
      p_staff_id: staffId,
    });

    if (error) {
      console.error("[admin] assign rpc error:", error.message);
      return {
        status: "error",
        message: "We could not assign this issue. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message: "That staff member could not be assigned to this issue.",
      };
    }

    revalidatePath(`/admin/issues/${complaintId}`);
    revalidatePath("/admin/issues");
    return { status: "success", message: "Issue assigned to the selected staff member." };
  } catch (error) {
    console.error("[admin] assign failed:", error);
    return {
      status: "error",
      message: "We could not assign this issue. Please try again.",
    };
  }
}

/**
 * Admin-only. Confirms an AI category/priority suggestion onto the complaint
 * row via `apply_ai_suggestion_admin` (SECURITY DEFINER). The function
 * re-checks `is_admin`, so a forged request is rejected at the database level.
 */
export async function applyAiSuggestionAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  await requireRole("admin");

  const complaintId = formData.get("complaintId")?.toString();
  const category = formData.get("category")?.toString();
  const priority = formData.get("priority")?.toString();

  if (!complaintId || !category || !priority) {
    return {
      status: "error",
      message: "Missing complaint id, category or priority.",
    };
  }

  try {
    const { data: ok, error } = await supabase.rpc("apply_ai_suggestion_admin", {
      p_complaint_id: complaintId,
      p_category: category as import("@/types/complaint").ComplaintCategory,
      p_priority: priority as import("@/types/complaint").ComplaintPriority,
    });

    if (error) {
      console.error("[admin] apply ai suggestion rpc error:", error.message);
      return {
        status: "error",
        message: "We could not apply the AI suggestion. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message: "You do not have permission to confirm this suggestion.",
      };
    }

    revalidatePath(`/admin/issues/${complaintId}`);
    revalidatePath("/admin/issues");
    return {
      status: "success",
      message: "AI suggestion applied to the complaint.",
    };
  } catch (error) {
    console.error("[admin] apply ai suggestion failed:", error);
    return {
      status: "error",
      message: "We could not apply the AI suggestion. Please try again.",
    };
  }
}
